// Pure helpers (no server-only import) so CLI scripts and tests can reuse them.
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

/** 32 random bytes (256 bits), URL-safe base64. */
export const generateToken = () => randomBytes(32).toString("base64url");

export const sha256Hex = (s: string) => createHash("sha256").update(s).digest("hex");

/** Alphabet without ambiguous characters (no 0/O, 1/I/L). */
const VAULT_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const VAULT_CODE_LENGTH = 8;

export function generateVaultCode(length = VAULT_CODE_LENGTH): string {
  let out = "";
  for (let i = 0; i < length; i++) out += VAULT_ALPHABET[randomInt(VAULT_ALPHABET.length)];
  return out;
}

/** Forgiving input: case, spaces and dashes don't matter. */
export const normalizeVaultCode = (s: string) => s.toUpperCase().replace(/[\s-]+/g, "");
export const isPlausibleVaultCode = (s: string) => new RegExp(`^[${VAULT_ALPHABET}]{${VAULT_CODE_LENGTH}}$`).test(s);
export const isPlausibleToken = (s: string) => /^[A-Za-z0-9_-]{43}$/.test(s);

export const hmacHex = (value: string, pepper: string) => createHmac("sha256", pepper).update(value).digest("hex");
export const hashVaultCode = (code: string, pepper: string) => hmacHex(normalizeVaultCode(code), pepper);

/** Signed, short-lived session cookie: `<linkId>.<expiresAtSec>.<sig>`. */
export function signSession(linkId: string, ttlSeconds: number, secret: string, nowMs = Date.now()) {
  const exp = Math.floor(nowMs / 1000) + ttlSeconds;
  const body = `${linkId}.${exp}`;
  return `${body}.${hmacHex(`session:${body}`, secret)}`;
}

export function verifySession(value: string | undefined, secret: string, nowMs = Date.now()): string | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [linkId = "", exp = "", sig = ""] = parts;
  if (!/^[0-9a-f-]{36}$/.test(linkId) || !/^\d+$/.test(exp)) return null;
  const expected = hmacHex(`session:${linkId}.${exp}`, secret);
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return Number(exp) > Math.floor(nowMs / 1000) ? linkId : null;
}
