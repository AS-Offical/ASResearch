import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const H = (c: string) => c.repeat(64);

before(async () => {
  await db.exec("create role anon; create role authenticated; create role service_role;");
  for (const f of readdirSync("supabase/migrations").sort()) await db.exec(readFileSync(`supabase/migrations/${f}`, "utf8"));
  await db.exec("grant usage on schema public to anon, authenticated;");
});

async function seed(opts: { expires?: string; revoked?: boolean; token?: string } = {}) {
  const r = await db.query<{ id: string }>(
    "insert into private_researches (kind, title_en, content_en) values ('mdx','T','# hi') returning id");
  const l = await db.query<{ id: string }>(
    `insert into private_share_links (research_id, token_hash, expires_at, revoked_at)
     values ($1,$2,$3,$4) returning id`,
    [r.rows[0].id, opts.token ?? H("a"), opts.expires ?? null, opts.revoked ? new Date().toISOString() : null]);
  return { research: r.rows[0].id, link: l.rows[0].id };
}
const reset = () => db.exec("truncate private_researches, access_attempts cascade");

test("valid link opens and counts atomically", async () => {
  await reset(); await seed();
  const a = await db.query("select * from open_share_link($1)", [H("a")]);
  assert.equal(a.rows.length, 1);
  await db.query("select * from open_share_link($1)", [H("a")]);
  const c = await db.query<{ access_count: string }>("select access_count from private_share_links");
  assert.equal(Number(c.rows[0].access_count), 2);
});
test("prefetch (p_count=false) returns content but does not count", async () => {
  await reset(); await seed();
  await db.query("select * from open_share_link($1, false)", [H("a")]);
  const c = await db.query<{ access_count: string }>("select access_count from private_share_links");
  assert.equal(Number(c.rows[0].access_count), 0);
});
test("unknown, expired and revoked links return nothing and do not count", async () => {
  await reset();
  await seed({ token: H("b"), expires: "2000-01-01T00:00:00Z" });
  await seed({ token: H("c"), revoked: true });
  for (const t of [H("z"), H("b"), H("c")]) assert.equal((await db.query("select * from open_share_link($1)", [t])).rows.length, 0);
  const c = await db.query<{ n: string }>("select coalesce(sum(access_count),0) n from private_share_links");
  assert.equal(Number(c.rows[0].n), 0);
});
test("future expiry still works", async () => {
  await reset(); await seed({ expires: "2999-01-01T00:00:00Z" });
  assert.equal((await db.query("select * from open_share_link($1)", [H("a")])).rows.length, 1);
});
test("vault code resolves only while code and link are live", async () => {
  await reset();
  const { link } = await seed();
  await db.query("insert into vault_codes (code_hash, private_share_link_id) values ($1,$2)", [H("d"), link]);
  assert.equal((await db.query<{ r: string }>("select resolve_vault_code($1) r", [H("d")])).rows[0].r, link);
  assert.equal((await db.query<{ r: string | null }>("select resolve_vault_code($1) r", [H("e")])).rows[0].r, null);
  await db.query("update private_share_links set revoked_at = now()");
  assert.equal((await db.query<{ r: string | null }>("select resolve_vault_code($1) r", [H("d")])).rows[0].r, null);
});
test("revoked or expired vault code fails", async () => {
  await reset();
  const { link } = await seed();
  await db.query("insert into vault_codes (code_hash, private_share_link_id, revoked_at) values ($1,$2,now())", [H("d"), link]);
  await db.query("insert into vault_codes (code_hash, private_share_link_id, expires_at) values ($1,$2,'2000-01-01')", [H("e"), link]);
  for (const h of [H("d"), H("e")]) assert.equal((await db.query<{ r: string | null }>("select resolve_vault_code($1) r", [h])).rows[0].r, null);
});
test("open by id respects revocation", async () => {
  await reset();
  const { link } = await seed();
  assert.equal((await db.query("select * from open_share_link_by_id($1)", [link])).rows.length, 1);
  await db.query("update private_share_links set revoked_at = now()");
  assert.equal((await db.query("select * from open_share_link_by_id($1)", [link])).rows.length, 0);
});
test("rate limit allows N then blocks, and resets after the window", async () => {
  await reset();
  const hit = async () => (await db.query<{ ok: boolean }>("select check_rate_limit('k','vault',3,60) ok")).rows[0].ok;
  assert.deepEqual([await hit(), await hit(), await hit(), await hit(), await hit()], [true, true, true, false, false]);
  await db.query("update access_attempts set window_start = now() - interval '61 seconds'");
  assert.equal(await hit(), true);
});
test("rate limit keys are independent per kind and key", async () => {
  await reset();
  await db.query("select check_rate_limit('k','vault',1,60)");
  assert.equal((await db.query<{ ok: boolean }>("select check_rate_limit('k','token',1,60) ok")).rows[0].ok, true);
  assert.equal((await db.query<{ ok: boolean }>("select check_rate_limit('k2','vault',1,60) ok")).rows[0].ok, true);
});
test("RLS is enabled on every table with zero policies", async () => {
  const t = await db.query<{ relname: string; relrowsecurity: boolean }>(
    "select relname, relrowsecurity from pg_class where relnamespace='public'::regnamespace and relkind='r'");
  assert.equal(t.rows.length, 4);
  for (const r of t.rows) assert.ok(r.relrowsecurity, r.relname);
  assert.equal((await db.query("select * from pg_policies")).rows.length, 0);
});
test("anon cannot read tables or call functions", async () => {
  await reset(); await seed();
  await db.exec("set role anon");
  try {
    for (const q of ["select * from private_researches", "select * from private_share_links", "select * from vault_codes", "select * from access_attempts",
      `select * from open_share_link('${H("a")}')`, "select check_rate_limit('k','vault',1,1)"]) {
      await assert.rejects(db.query(q), /permission denied/, q);
    }
  } finally { await db.exec("reset role"); }
});
test("bundle rows need a storage_path; mdx rows need content", async () => {
  await assert.rejects(db.query("insert into private_researches (kind) values ('bundle')"));
  await assert.rejects(db.query("insert into private_researches (kind) values ('mdx')"));
  await assert.rejects(db.query("insert into private_researches (kind, content_en) values ('other','x')"));
});
test("raw token never needs to be stored: token_hash must be 64 hex", async () => {
  const { research } = await seed({ token: H("f") });
  await assert.rejects(db.query("insert into private_share_links (research_id, token_hash) values ($1,'plain-token')", [research]));
});
