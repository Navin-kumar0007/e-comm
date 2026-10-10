import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SimpleMarkdown } from "@/components/storefront/simple-markdown";
import { liveBanners } from "@/lib/site-content";

const md = (t: string) => renderToStaticMarkup(<SimpleMarkdown text={t} />);

describe("SimpleMarkdown", () => {
  it("renders headings, lists, bold and safe links", () => {
    const html = md("# Shipping\n\nWe ship in **2 days**.\n\n- Free above ₹999\n- [Track](/track)\n\n1. Pack\n2. Ship");
    expect(html).toContain("<h2>Shipping</h2>");
    expect(html).toContain("<strong>2 days</strong>");
    expect(html).toContain('<ul><li>Free above ₹999</li><li><a href="/track" class="text-primary underline">Track</a></li></ul>');
    expect(html).toContain("<ol><li>Pack</li><li>Ship</li></ol>");
  });
  it("never injects HTML or unsafe links", () => {
    const html = md('<script>alert(1)</script>\n\n[x](javascript:alert(1)) <img src=x onerror=alert(1)>');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("liveBanners", () => {
  const now = new Date("2026-10-15T10:00:00Z");
  it("shows only enabled banners inside their dates", () => {
    const b = (o: object) => ({ id: "x", image: "/a.jpg", alt: "a", enabled: true, ...o });
    const out = liveBanners([b({ id: "on" }), b({ id: "off", enabled: false }), b({ id: "future", startsAt: "2026-11-01T00:00" }), b({ id: "ended", endsAt: "2026-10-01T00:00" }), b({ id: "noimg", image: "" })], now);
    expect(out.map((x) => x.id)).toEqual(["on"]);
  });
});
