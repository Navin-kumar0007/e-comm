import { describe, it, expect, beforeAll } from "vitest";
import { isSendingHours, customerKey, couponCode, istLabel } from "@/lib/automations";
import { linkToken, checkLinkToken, cartRestoreUrl } from "@/lib/signed-link";
import { WA_TEMPLATES } from "@/lib/whatsapp-templates";

beforeAll(() => {
  process.env.AUTH_SECRET ||= "test-secret";
});

describe("customer-message robots", () => {
  it("only sends between 9 am and 9 pm India time", () => {
    expect(isSendingHours(new Date("2026-10-22T03:29:00Z"))).toBe(false); // 8:59 am IST
    expect(isSendingHours(new Date("2026-10-22T03:30:00Z"))).toBe(true); // 9:00 am IST
    expect(isSendingHours(new Date("2026-10-22T15:29:00Z"))).toBe(true); // 8:59 pm IST
    expect(isSendingHours(new Date("2026-10-22T15:30:00Z"))).toBe(false); // 9:00 pm IST
  });

  it("groups one customer by phone, else by email", () => {
    expect(customerKey({ customerPhone: "+91 98765-43210", customerEmail: "A@x.com" })).toBe("9876543210");
    expect(customerKey({ customerPhone: "", customerEmail: " A@X.com " })).toBe("a@x.com");
  });

  it("makes readable one-time coupon codes", () => {
    const code = couponCode();
    expect(code).toMatch(/^BACK5-[A-HJ-NP-Z2-9]{5}$/);
  });

  it("shows the coupon deadline in India time", () => {
    expect(istLabel(new Date("2026-10-24T12:30:00Z"))).toBe("24 Oct, 6 pm");
  });
});

describe("signed links", () => {
  it("accepts the right token and rejects others", () => {
    const t = linkToken("cart", "order1");
    expect(checkLinkToken("cart", "order1", t)).toBe(true);
    expect(checkLinkToken("cart", "order2", t)).toBe(false);
    expect(checkLinkToken("review", "order1", t)).toBe(false);
    expect(checkLinkToken("cart", "order1", "")).toBe(false);
    expect(cartRestoreUrl("order1")).toMatch(/\/cart\/restore\/order1\/[\w-]{24}$/);
  });
});

describe("new WhatsApp templates follow Meta's rules", () => {
  it("never start or end with a variable", () => {
    for (const key of ["payment_pending", "cart_coupon", "review_request"] as const) {
      const body = WA_TEMPLATES[key].body;
      expect(body.trimStart().startsWith("{{"), key).toBe(false);
      expect(body.trimEnd().endsWith("}}"), key).toBe(false);
    }
  });
});
