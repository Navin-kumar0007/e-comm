// Two-step login for staff: time-based one-time codes (RFC 6238, as used by
// Google Authenticator / Microsoft Authenticator), one-time backup codes, and a
// signed cookie that marks this browser as verified for a while.

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer) {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string) {
  const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export const newTotpSecret = () => base32Encode(randomBytes(20));

/** The code for a given time step (30 s), `digits` long. */
export function hotp(secret: Buffer, counter: number, digits = 6) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", secret).update(msg).digest();
  const off = h[h.length - 1] & 15;
  const bin = ((h[off] & 127) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(bin % 10 ** digits).padStart(digits, "0");
}

export const totpAt = (secretB32: string, time = Date.now(), digits = 6) => hotp(base32Decode(secretB32), Math.floor(time / 30000), digits);

/** Accepts the current code and one step either side (phone clocks drift). */
export function verifyTotp(secretB32: string, code: string, time = Date.now()) {
  const c = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return false;
  const key = base32Decode(secretB32);
  const step = Math.floor(time / 30000);
  return [-1, 0, 1].some((d) => {
    const expect = Buffer.from(hotp(key, step + d));
    return timingSafeEqual(expect, Buffer.from(c));
  });
}

export function otpauthUrl(secretB32: string, account: string, issuer = "Spicy Nuts Admin") {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secretB32}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
}

// ── Secret storage ──

function key(purpose: string) {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return createHash("sha256").update(`${purpose}:${s}`).digest();
}

/** AES-256-GCM, so a database leak alone doesn't expose the secret. */
export function encryptSecret(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key("totp"), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `v1.${iv.toString("base64url")}.${c.getAuthTag().toString("base64url")}.${enc.toString("base64url")}`;
}

export function decryptSecret(stored: string) {
  const [v, iv, tag, enc] = stored.split(".");
  if (v !== "v1") throw new Error("Unknown secret format");
  const d = createDecipheriv("aes-256-gcm", key("totp"), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(enc, "base64url")), d.final()]).toString("utf8");
}

// ── Backup codes ──

export const hashCode = (code: string) => createHash("sha256").update(code.replace(/[\s-]/g, "").toUpperCase()).digest("hex");

export function newBackupCodes(n = 8) {
  return Array.from({ length: n }, () => {
    const raw = base32Encode(randomBytes(5)).slice(0, 8);
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  });
}

/** Returns the remaining hashes when `code` matches one, else null. */
export function useBackupCode(hashesJson: string | null, code: string): string[] | null {
  const hashes: string[] = hashesJson ? JSON.parse(hashesJson) : [];
  const h = hashCode(code);
  const i = hashes.indexOf(h);
  if (i < 0) return null;
  return hashes.filter((_, j) => j !== i);
}

// ── "This browser passed two-step" cookie ──

export const TWO_STEP_COOKIE = "sn_admin_2fa";
export const TWO_STEP_HOURS = 12;

export function signTwoStep(userId: string, now = Date.now()) {
  const exp = now + TWO_STEP_HOURS * 36e5;
  const body = `${userId}.${exp}`;
  const sig = createHmac("sha256", key("2fa-cookie")).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function checkTwoStep(cookie: string | undefined, userId: string, now = Date.now()) {
  if (!cookie) return false;
  const [id, exp, sig] = cookie.split(".");
  if (id !== userId || !exp || !sig || Number(exp) < now) return false;
  const expect = createHmac("sha256", key("2fa-cookie")).update(`${id}.${exp}`).digest("base64url");
  return expect.length === sig.length && timingSafeEqual(Buffer.from(expect), Buffer.from(sig));
}
