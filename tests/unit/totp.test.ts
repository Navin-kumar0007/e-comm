import { describe, it, expect, beforeAll } from "vitest";
import {
  base32Encode, base32Decode, hotp, totpAt, verifyTotp, encryptSecret, decryptSecret, newBackupCodes, hashCode, useBackupCode, signTwoStep, checkTwoStep,
} from "@/lib/totp";

beforeAll(() => { process.env.AUTH_SECRET = process.env.AUTH_SECRET || "test-secret-for-unit-tests"; });

// RFC 6238 appendix B (SHA-1), secret = ASCII "12345678901234567890"
const RFC = base32Encode(Buffer.from("12345678901234567890"));

describe("totp", () => {
  it("matches the RFC 6238 test vectors", () => {
    expect(totpAt(RFC, 59_000, 8)).toBe("94287082");
    expect(totpAt(RFC, 1111111109_000, 8)).toBe("07081804");
    expect(totpAt(RFC, 20000000000_000, 8)).toBe("65353130");
  });
  it("round-trips base32 and matches RFC 4226 HOTP", () => {
    expect(base32Decode(RFC).toString()).toBe("12345678901234567890");
    expect(hotp(Buffer.from("12345678901234567890"), 0)).toBe("755224");
    expect(hotp(Buffer.from("12345678901234567890"), 9)).toBe("520489");
  });
  it("accepts the previous, current and next code only", () => {
    const t = 1_800_000_000_000;
    expect(verifyTotp(RFC, totpAt(RFC, t), t)).toBe(true);
    expect(verifyTotp(RFC, totpAt(RFC, t - 30_000), t)).toBe(true);
    expect(verifyTotp(RFC, totpAt(RFC, t + 30_000), t)).toBe(true);
    expect(verifyTotp(RFC, totpAt(RFC, t - 90_000), t)).toBe(false);
    expect(verifyTotp(RFC, "12345", t)).toBe(false);
  });
});

describe("storage and cookies", () => {
  it("encrypts secrets", () => {
    const enc = encryptSecret("JBSWY3DPEHPK3PXP");
    expect(enc).not.toContain("JBSWY3DPEHPK3PXP");
    expect(decryptSecret(enc)).toBe("JBSWY3DPEHPK3PXP");
  });
  it("uses each backup code once", () => {
    const codes = newBackupCodes();
    expect(codes).toHaveLength(8);
    const json = JSON.stringify(codes.map(hashCode));
    const left = useBackupCode(json, codes[2].toLowerCase());
    expect(left).toHaveLength(7);
    expect(useBackupCode(JSON.stringify(left), codes[2])).toBeNull();
  });
  it("signs the verified-browser cookie for one user and expires it", () => {
    const now = 1_800_000_000_000;
    const c = signTwoStep("user1", now);
    expect(checkTwoStep(c, "user1", now + 1000)).toBe(true);
    expect(checkTwoStep(c, "user2", now + 1000)).toBe(false);
    expect(checkTwoStep(c, "user1", now + 13 * 36e5)).toBe(false);
    expect(checkTwoStep(c.replace(/.$/, (ch) => (ch === "A" ? "B" : "A")), "user1", now)).toBe(false);
  });
});
