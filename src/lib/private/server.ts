import "server-only";
import { cookies, headers } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hmacHex, isPlausibleToken, sha256Hex, signSession, verifySession } from "./crypto";
import { routing, type Locale } from "@/i18n/routing";

export const SESSION_COOKIE = "as_vault";
export const SESSION_TTL_SECONDS = 15 * 60;

export type PrivateResearch = {
  link_id: string;
  research_id: string;
  kind: "mdx" | "bundle";
  title_en: string | null;
  title_ar: string | null;
  summary_en: string | null;
  summary_ar: string | null;
  content_en: string | null;
  content_ar: string | null;
  storage_path: string | null;
  created_at: string;
};

type Config = { url: string; key: string; pepper: string; secret: string };

/** Fails closed: if anything is missing, private access is simply unavailable. */
function config(): Config | null {
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, VAULT_PEPPER: pepper, SESSION_SECRET: secret } = process.env;
  return url && key && pepper && secret ? { url, key, pepper, secret } : null;
}

let client: SupabaseClient | null = null;
function db(c: Config) {
  client ??= createClient(c.url, c.key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

/** Locale for private pages (no locale prefix): the NEXT_LOCALE cookie, else the default. */
export async function getPrivateLocale(): Promise<Locale> {
  const v = (await cookies()).get("NEXT_LOCALE")?.value;
  return (routing.locales as readonly string[]).includes(v ?? "") ? (v as Locale) : routing.defaultLocale;
}

const BOT_RE = /bot|crawl|spider|preview|slurp|facebookexternalhit|whatsapp|telegram|discord|slack|skype|linkedin|embedly|curl|wget/i;

/** Prefetches and link-preview robots must not count as an open (best effort). */
export async function shouldCountOpen(): Promise<boolean> {
  const h = await headers();
  if (h.get("next-router-prefetch") || /prefetch|preview/i.test(`${h.get("purpose") ?? ""} ${h.get("sec-purpose") ?? ""}`)) return false;
  return !BOT_RE.test(h.get("user-agent") ?? "");
}

/** Rate-limit key derived from the client IP; the raw IP is never stored. */
async function clientKey(c: Config): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  return hmacHex(`ip:${ip}`, c.pepper);
}

async function allowed(c: Config, kind: "token" | "vault", limit: number, windowSeconds: number) {
  const { data, error } = await db(c).rpc("check_rate_limit", {
    p_key: await clientKey(c), p_kind: kind, p_limit: limit, p_window_seconds: windowSeconds,
  });
  return !error && data === true;
}

const one = (data: unknown): PrivateResearch | null => (Array.isArray(data) && data.length ? (data[0] as PrivateResearch) : null);

export type OpenResult = { status: "ok"; research: PrivateResearch } | { status: "unavailable" } | { status: "limited" };

export async function openByToken(token: string): Promise<OpenResult> {
  const c = config();
  if (!c) return { status: "unavailable" };
  if (!(await allowed(c, "token", 30, 60))) return { status: "limited" };
  if (!isPlausibleToken(token)) return { status: "unavailable" };
  const { data, error } = await db(c).rpc("open_share_link", { p_token_hash: sha256Hex(token), p_count: await shouldCountOpen() });
  const research = error ? null : one(data);
  return research ? { status: "ok", research } : { status: "unavailable" };
}

export type VaultResult = { status: "ok" } | { status: "invalid" } | { status: "limited" };

/** Verifies a vault code and, on success, starts a short signed session (no code in any URL). */
export async function verifyVault(codeHash: (pepper: string) => string, plausible: boolean): Promise<VaultResult> {
  const c = config();
  if (!c) return { status: "invalid" };
  if (!(await allowed(c, "vault", 5, 600))) return { status: "limited" };
  if (!plausible) return { status: "invalid" };
  const { data, error } = await db(c).rpc("resolve_vault_code", { p_code_hash: codeHash(c.pepper) });
  if (error || typeof data !== "string") return { status: "invalid" };
  await db(c).rpc("open_share_link_by_id", { p_link_id: data, p_count: await shouldCountOpen() });
  (await cookies()).set(SESSION_COOKIE, signSession(data, SESSION_TTL_SECONDS, c.secret), {
    httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/vault", maxAge: SESSION_TTL_SECONDS,
  });
  return { status: "ok" };
}

/** Reads the research for the current vault session; never counts (counting happens at verification). */
export async function openVaultSession(): Promise<PrivateResearch | null> {
  const c = config();
  if (!c) return null;
  const linkId = verifySession((await cookies()).get(SESSION_COOKIE)?.value, c.secret);
  if (!linkId) return null;
  const { data, error } = await db(c).rpc("open_share_link_by_id", { p_link_id: linkId, p_count: false });
  return error ? null : one(data);
}
