import { test } from "node:test";
import assert from "node:assert/strict";
import { generateToken, sha256Hex, generateVaultCode, normalizeVaultCode, isPlausibleVaultCode, isPlausibleToken, hashVaultCode, signSession, verifySession } from "../src/lib/private/crypto.ts";

const LINK = "3f2c1c4e-8b7a-4a52-9d1e-0a1b2c3d4e5f";

test("token has >=256 bits, is URL-safe and unique", () => {
  const t = generateToken();
  assert.equal(Buffer.from(t, "base64url").length, 32);
  assert.match(t, /^[A-Za-z0-9_-]+$/);
  assert.ok(isPlausibleToken(t));
  assert.notEqual(t, generateToken());
});
test("sha256 is 64 hex chars and deterministic", () => {
  assert.match(sha256Hex("x"), /^[0-9a-f]{64}$/);
  assert.equal(sha256Hex("x"), sha256Hex("x"));
});
test("vault code uses only unambiguous characters", () => {
  for (let i = 0; i < 500; i++) {
    const c = generateVaultCode();
    assert.ok(isPlausibleVaultCode(c), c);
    assert.doesNotMatch(c, /[01OIL]/);
  }
});
test("vault code normalization ignores case, spaces, dashes", () => {
  assert.equal(normalizeVaultCode(" abcd-efgh "), "ABCDEFGH");
  assert.equal(hashVaultCode("abcd-efgh", "p"), hashVaultCode("ABCDEFGH", "p"));
});
test("vault hash depends on the pepper", () => {
  assert.notEqual(hashVaultCode("ABCDEFGH", "pepper-a"), hashVaultCode("ABCDEFGH", "pepper-b"));
});
test("session cookie round-trips and rejects tampering/expiry/wrong secret", () => {
  const now = 1_800_000_000_000;
  const c = signSession(LINK, 900, "s", now);
  assert.equal(verifySession(c, "s", now + 1000), LINK);
  assert.equal(verifySession(c, "other", now + 1000), null);
  assert.equal(verifySession(c, "s", now + 901_000), null);
  assert.equal(verifySession(c.replace(LINK, "3f2c1c4e-8b7a-4a52-9d1e-0a1b2c3d4e50"), "s", now), null);
  assert.equal(verifySession(undefined, "s"), null);
  assert.equal(verifySession("garbage", "s"), null);
});
