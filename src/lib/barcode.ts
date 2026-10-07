// EAN-13 helpers.
//
// In-store codes use GS1's "restricted circulation" range (prefix 21): valid EAN-13
// that scanners read, never clashing with a real product, but not accepted by
// marketplaces. Replace them with GS1 India codes (890…) when you have them.

export const IN_STORE_PREFIX = "21";

/** Check digit for the first 12 digits of an EAN-13. */
export function ean13CheckDigit(first12: string): number {
  if (!/^\d{12}$/.test(first12)) throw new Error("EAN-13 needs 12 digits before the check digit");
  const sum = first12.split("").reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10;
}

export function isValidEan13(code: string): boolean {
  const c = code.trim();
  return /^\d{13}$/.test(c) && ean13CheckDigit(c.slice(0, 12)) === Number(c[12]);
}

/** In-store EAN-13 from a running number: 21 + 10-digit sequence + check digit. */
export function inStoreEan13(seq: number): string {
  if (!Number.isInteger(seq) || seq < 1 || seq > 9_999_999_999) throw new Error("Sequence out of range");
  const first12 = IN_STORE_PREFIX + String(seq).padStart(10, "0");
  return first12 + ean13CheckDigit(first12);
}

export function isInStoreCode(code: string) {
  return code.startsWith(IN_STORE_PREFIX) && code.length === 13;
}

/** "8901234567890" → "8 901234 567890" (how it is printed under the bars). */
export function formatEan13(code: string) {
  return code.length === 13 ? `${code[0]} ${code.slice(1, 7)} ${code.slice(7)}` : code;
}
