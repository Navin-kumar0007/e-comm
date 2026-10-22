import { createHmac, timingSafeEqual } from "crypto";

// Private links in reminder messages (restore a cart, review an order). Each token signs the
// purpose and the order ID, so a cart link can't be reused as a review link or for another order.

export type LinkPurpose = "cart" | "review";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.spicynuts.in").replace(/\/+$/, "");

function key() {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return `signed-link:${s}`;
}

export const linkToken = (purpose: LinkPurpose, orderId: string) =>
  createHmac("sha256", key()).update(`${purpose}:${orderId}`).digest("base64url").slice(0, 24);

export function checkLinkToken(purpose: LinkPurpose, orderId: string, token: string) {
  const expect = Buffer.from(linkToken(purpose, orderId));
  const got = Buffer.from(token || "");
  return expect.length === got.length && timingSafeEqual(expect, got);
}

export const cartRestoreUrl = (orderId: string) => `${SITE}/cart/restore/${orderId}/${linkToken("cart", orderId)}`;
export const reviewUrl = (orderId: string) => `${SITE}/review/${orderId}/${linkToken("review", orderId)}`;
