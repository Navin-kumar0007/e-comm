import { createHmac, timingSafeEqual } from "crypto";

// A private link to one bill, so a shop customer can open or save their invoice without an account.
// The token is a signature of the order ID; it can't be guessed or reused for another order.

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.spicynuts.in";

function key() {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return `bill-link:${s}`;
}

export const billToken = (orderId: string) => createHmac("sha256", key()).update(orderId).digest("base64url").slice(0, 24);

export function checkBillToken(orderId: string, token: string) {
  const expect = Buffer.from(billToken(orderId));
  const got = Buffer.from(token || "");
  return expect.length === got.length && timingSafeEqual(expect, got);
}

export const billUrl = (orderId: string) => `${SITE}/bill/${orderId}/${billToken(orderId)}`;
