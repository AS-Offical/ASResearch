// Owner-only CLI. Run: npm run private -- <command> [options]   (reads .env.local)
// The raw token / vault code is printed ONCE here and is never stored.
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { generateToken, generateVaultCode, hashVaultCode, sha256Hex } from "../src/lib/private/crypto.ts";

const need = (k: string) => { const v = process.env[k]; if (!v) { console.error(`Missing env ${k} (put it in .env.local)`); process.exit(1); } return v; };
const db = () => createClient(need("SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const must = <T>(r: { data: T; error: { message: string } | null }) => { if (r.error) { console.error(r.error.message); process.exit(1); } return r.data; };
const iso = (s?: string) => { if (!s) return null; const d = new Date(s); if (isNaN(+d)) { console.error(`Bad date: ${s}`); process.exit(1); } return d.toISOString(); };

const { positionals: [cmd, arg], values: o } = parseArgs({
  allowPositionals: true,
  options: { "title-en": { type: "string" }, "title-ar": { type: "string" }, "summary-en": { type: "string" }, "summary-ar": { type: "string" },
    en: { type: "string" }, ar: { type: "string" }, tags: { type: "string" }, expires: { type: "string" } },
});

const HELP = `Commands:
  add-mdx --title-en T --en file.mdx [--title-ar T --ar file.mdx] [--summary-en S] [--summary-ar S] [--tags a,b]
  link <research-id> [--expires 2026-12-31]      create a share link (prints URL once)
  code <link-id> [--expires 2026-12-31]          create a vault code (prints once)
  revoke-link <link-id> | revoke-code <code-id>
  list                                           researches, links, counts`;

if (cmd === "add-mdx") {
  if (!o.en && !o.ar) { console.error("Provide --en and/or --ar"); process.exit(1); }
  const row = { kind: "mdx", title_en: o["title-en"] ?? null, title_ar: o["title-ar"] ?? null, summary_en: o["summary-en"] ?? null, summary_ar: o["summary-ar"] ?? null,
    content_en: o.en ? readFileSync(o.en, "utf8") : null, content_ar: o.ar ? readFileSync(o.ar, "utf8") : null, tags: o.tags ? o.tags.split(",").map((s) => s.trim()) : [] };
  const d = must(await db().from("private_researches").insert(row).select("id").single());
  console.log(`Research id: ${d.id}`);
} else if (cmd === "link" && arg) {
  const token = generateToken();
  const d = must(await db().from("private_share_links").insert({ research_id: arg, token_hash: sha256Hex(token), expires_at: iso(o.expires) }).select("id").single());
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  console.log(`Link id: ${d.id}\nURL (shown once, not stored): ${base}/v/${token}`);
} else if (cmd === "code" && arg) {
  const code = generateVaultCode();
  const d = must(await db().from("vault_codes").insert({ private_share_link_id: arg, code_hash: hashVaultCode(code, need("VAULT_PEPPER")), expires_at: iso(o.expires) }).select("id").single());
  console.log(`Code id: ${d.id}\nVault code (shown once, not stored): ${code}`);
} else if (cmd === "revoke-link" && arg) {
  must(await db().from("private_share_links").update({ revoked_at: new Date().toISOString() }).eq("id", arg).is("revoked_at", null));
  console.log("Revoked (if it was live).");
} else if (cmd === "revoke-code" && arg) {
  must(await db().from("vault_codes").update({ revoked_at: new Date().toISOString() }).eq("id", arg).is("revoked_at", null));
  console.log("Revoked (if it was live).");
} else if (cmd === "list") {
  const r = must(await db().from("private_researches").select("id, kind, title_en, title_ar, private_share_links(id, expires_at, revoked_at, access_count, last_accessed_at, vault_codes(id, expires_at, revoked_at))").order("created_at"));
  console.log(JSON.stringify(r, null, 2));
} else console.log(HELP);
