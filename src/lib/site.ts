// The shop's public address and the short order code customers see. Pure — safe anywhere.

/** Final address of the shop (spicynuts.in redirects here). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.spicynuts.in").replace(/\/+$/, "");

/** Short order code shown to customers and couriers: "SN-" + last 8 characters of the order id. */
export function orderRef(id: string) {
  return `SN-${id.slice(-8).toUpperCase()}`;
}

/** Turns a typed code back into the id fragment. Accepts SN-…, the old NW-… codes, "#…" or the full id. */
export function stripOrderRef(q: string) {
  return q.trim().replace(/^(SN|NW)-/i, "").replace(/^#/, "");
}
