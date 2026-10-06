import { describe, it, expect, afterEach } from "vitest";
import { buildTemplatePayload, WA_TEMPLATES } from "@/lib/whatsapp-templates";

afterEach(() => {
  delete process.env.WA_TEMPLATE_ORDER_SHIPPED;
});

describe("WhatsApp templates", () => {
  it("returns null until the approved template name is configured", () => {
    expect(buildTemplatePayload({ key: "order_shipped", params: ["1A2B", "Xpressbees", "141", "https://x"] })).toBeNull();
  });

  it("builds a Cloud API template with cleaned parameters", () => {
    process.env.WA_TEMPLATE_ORDER_SHIPPED = "order_shipped_v1";
    const payload = buildTemplatePayload({ key: "order_shipped", params: ["1A2B", "Line1\nLine2", "", 42] });
    expect(payload?.name).toBe("order_shipped_v1");
    expect(payload?.language.code).toBe("en");
    expect(payload?.components[0].parameters.map((p) => p.text)).toEqual(["1A2B", "Line1 · Line2", "-", "42"]);
  });

  it("every template's example matches its placeholder count", () => {
    for (const [key, t] of Object.entries(WA_TEMPLATES)) {
      const placeholders = new Set(t.body.match(/\{\{\d+\}\}/g)).size;
      expect(t.example.length, key).toBe(placeholders);
    }
  });
});
