import { generateToken, sha256Hex, hashVaultCode } from "../../src/lib/private/crypto.ts";
const B = "http://localhost:3100", M = "http://127.0.0.1:54321/_sql";
const sql = async (q: string, p: unknown[] = []) => (await fetch(M, { method: "POST", body: JSON.stringify({ q, p }) })).json();
const ok = (c: boolean, m: string) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) process.exitCode = 1; };
const [{ id: rid }] = await sql("insert into private_researches (kind,title_en,title_ar,content_en,content_ar) values ('mdx','Secret Study','دراسة سرية','# Hello\n\nbody en','# مرحبا\n\nنص') returning id");
const mk = async (extra = "") => { const t = generateToken(); const [{ id }] = await sql(`insert into private_share_links (research_id, token_hash ${extra ? ",expires_at" : ""}) values ($1,$2 ${extra ? ",$3" : ""}) returning id`, extra ? [rid, sha256Hex(t), extra] : [rid, sha256Hex(t)]); return { t, id }; };
const count = async (id: string) => Number((await sql("select access_count c from private_share_links where id=$1", [id]))[0].c);

const good = await mk();
const r = await fetch(`${B}/v/${good.t}`); const html = await r.text();
ok(r.status === 200 && html.includes("Secret Study"), "valid token renders private MDX");
ok(r.headers.get("cache-control")?.includes("no-store") === true, "Cache-Control private, no-store");
ok(r.headers.get("referrer-policy") === "no-referrer", "Referrer-Policy: no-referrer");
ok(r.headers.get("x-robots-tag") === "noindex, nofollow", "X-Robots-Tag noindex, nofollow");
ok(/<meta name="robots" content="noindex, nofollow/.test(html), "robots meta tag present");
const visible = html.replace(/<script[\s\S]*?<\/script>/g, ""); ok(!visible.includes(good.t), "raw token is not in the visible page/content (only in Next's route payload for the page's own URL)");
ok(!/og:title|og:description/.test(html), "no Open Graph on private pages");
ok(await count(good.id) === 1, "successful open counted once");
await fetch(`${B}/v/${good.t}`, { headers: { "user-agent": "Slackbot-LinkExpanding 1.0" } });
await fetch(`${B}/v/${good.t}`, { headers: { "sec-purpose": "prefetch" } });
ok(await count(good.id) === 1, "bot preview and prefetch are not counted");
const ar = await fetch(`${B}/v/${good.t}`, { headers: { cookie: "NEXT_LOCALE=ar" } }); const arh = await ar.text();
ok(/<html lang="ar" dir="rtl"/.test(arh) && arh.includes("دراسة سرية"), "Arabic locale cookie gives RTL Arabic content");

const body = async (u: string) => { const x = await fetch(u); return { s: x.status, h: await x.text() }; };
const bogus = await body(`${B}/v/${generateToken()}`);
const exp = await mk("2000-01-01T00:00:00Z"); const expired = await body(`${B}/v/${exp.t}`);
const rev = await mk(); await sql("update private_share_links set revoked_at=now() where id=$1", [rev.id]); const revoked = await body(`${B}/v/${rev.t}`);
const strip = (h: string) => h.replace(/<script[\s\S]*?<\/script>/g, "").replace(/\/_next\/[^"]+/g, "");
ok(bogus.h.includes("isn’t available") && !bogus.h.includes("Secret Study"), "unknown token shows generic unavailable page");
ok(strip(bogus.h) === strip(expired.h) && strip(expired.h) === strip(revoked.h), "unknown, expired and revoked pages are identical");
ok(await count(exp.id) === 0 && await count(rev.id) === 0, "failed opens never count");
ok((await body(`${B}/v/short`)).h.includes("isn’t available"), "malformed token is rejected without a DB lookup");

// Vault
const pepper = "test-pepper-123", code = "ABCD2345"; const link = await mk();
await sql("insert into vault_codes (code_hash, private_share_link_id) values ($1,$2)", [hashVaultCode(code, pepper), link.id]);
const page = await fetch(`${B}/vault`); const ph = await page.text();
ok(page.status === 200 && page.headers.get("x-robots-tag") === "noindex, nofollow" && page.headers.get("cache-control")?.includes("no-store") === true, "/vault is noindex and no-store");
const hidden = [...ph.matchAll(/<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?/g)].map((m) => [m[1], (m[2] ?? "").replace(/&quot;/g, '"').replace(/&amp;/g, "&")] as [string, string]);
ok(hidden.length > 0, "vault form carries server-action fields (works without JS)");
async function submit(c: string) {
  const fd = new FormData(); for (const [k, v] of hidden) fd.set(k, v); fd.set("code", c);
  const x = await fetch(`${B}/vault`, { method: "POST", body: fd, redirect: "manual", headers: { origin: B } });
  return { s: x.status, loc: x.headers.get("location"), cookie: x.headers.get("set-cookie") ?? "", text: await x.text() };
}
const bad = await submit("ZZZZ9999"); ok(!bad.cookie.includes("as_vault"), "wrong code sets no session");
const good2 = await submit("abcd-2345");
ok(good2.cookie.includes("as_vault=") && /httponly/i.test(good2.cookie) && /samesite=strict/i.test(good2.cookie), "right code (any case/dash) sets httpOnly strict cookie");
ok(!(good2.loc ?? "").includes("ABCD") && !good2.cookie.includes(code), "code appears neither in URL nor cookie");
const cookie = /as_vault=([^;]+)/.exec(good2.cookie)?.[1] ?? "";
const read = await body(`${B}/vault/read`); ok(read.h.includes("isn’t available"), "/vault/read without session is unavailable");
const rr = await fetch(`${B}/vault/read`, { headers: { cookie: `as_vault=${cookie}` } }); ok((await rr.text()).includes("Secret Study"), "valid session shows the research");
const bad2 = await fetch(`${B}/vault/read`, { headers: { cookie: `as_vault=${cookie.slice(0, -2)}xx` } }); ok((await bad2.text()).includes("isn’t available"), "tampered session rejected");
ok(await count(link.id) === 1, "vault success counted once");
await sql("update private_share_links set revoked_at=now() where id=$1", [link.id]);
const rr2 = await fetch(`${B}/vault/read`, { headers: { cookie: `as_vault=${cookie}` } }); ok((await rr2.text()).includes("isn’t available"), "revoking the link ends an active vault session");
let limited = false; for (let i = 0; i < 8; i++) { const s = await submit("ZZZZ9999"); if (s.text.includes("Too many") || s.text.includes("limited")) limited = true; }
ok(limited, "vault attempts are rate limited");
const keys = await sql("select key from access_attempts"); ok(keys.every((k: { key: string }) => /^[0-9a-f]{64}$/.test(k.key)), "rate-limit keys are hashed (no raw IP stored)");
