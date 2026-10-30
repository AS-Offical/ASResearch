// Test-only PostgREST stand-in: POST /rest/v1/rpc/<fn> backed by PGlite running the real migration.
import http from "node:http";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
await db.exec("create role anon; create role authenticated; create role service_role;");
for (const f of readdirSync("supabase/migrations").sort()) await db.exec(readFileSync(`supabase/migrations/${f}`, "utf8"));
const sig = { open_share_link: ["p_token_hash", "p_count"], open_share_link_by_id: ["p_link_id", "p_count"], resolve_vault_code: ["p_code_hash"], check_rate_limit: ["p_key", "p_kind", "p_limit", "p_window_seconds"] };
http.createServer(async (req, res) => {
  let body = ""; for await (const c of req) body += c;
  try {
    if (req.url === "/_sql") { const r = await db.query(JSON.parse(body).q, JSON.parse(body).p ?? []); res.end(JSON.stringify(r.rows)); return; }
    const fn = req.url.split("/rpc/")[1]; const a = JSON.parse(body || "{}"); const names = sig[fn];
    const r = await db.query(`select * from public.${fn}(${names.map((_, i) => `$${i + 1}`).join(",")}) as r`, names.map((n) => a[n]));
    const scalar = ["resolve_vault_code", "check_rate_limit"].includes(fn);
    const out = scalar ? Object.values(r.rows[0])[0] : r.rows;
    res.setHeader("content-type", "application/json"); res.end(JSON.stringify(out));
  } catch (e) { res.statusCode = 400; res.end(JSON.stringify({ message: String(e) })); }
}).listen(54321, () => console.log("mock up"));
