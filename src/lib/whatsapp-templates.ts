// WhatsApp message templates for the Meta Cloud API.
//
// Meta only delivers business-initiated messages (order updates, offers) as
// pre-approved templates. Submit each template below in Meta Business Manager
// → WhatsApp Manager → Message templates, with EXACTLY this body text, then put
// the approved template name in the matching env var. Until a template's env
// var is set, that message is sent as plain text (only delivered if the
// customer messaged you in the last 24 hours).

export type TemplateKey =
  | "order_confirmed"
  | "order_shipped"
  | "order_out_for_delivery"
  | "order_delivery_failed"
  | "order_delivered"
  | "order_cancelled"
  | "welcome"
  | "offer"
  | "new_release"
  | "price_drop"
  | "price_alert_subscribed"
  | "owner_daily_summary";

export const WA_TEMPLATES: Record<TemplateKey, { env: string; category: "UTILITY" | "MARKETING"; body: string; example: string[] }> = {
  order_confirmed: {
    env: "WA_TEMPLATE_ORDER_CONFIRMED",
    category: "UTILITY",
    body: "Hi {{1}}, your Spicy Nuts order #{{2}} for ₹{{3}} is confirmed ({{4}}). Track it here: {{5}}",
    example: ["Priya", "1A2B3C4D", "650", "Cash on Delivery", "https://www.spicynuts.in/track/abc"],
  },
  order_shipped: {
    env: "WA_TEMPLATE_ORDER_SHIPPED",
    category: "UTILITY",
    body: "Your Spicy Nuts order #{{1}} has shipped with {{2}} (AWB {{3}}). Track it here: {{4}}",
    example: ["1A2B3C4D", "Xpressbees", "14150000000001", "https://www.xpressbees.com/shipment/tracking?awbNo=14150000000001"],
  },
  order_out_for_delivery: {
    env: "WA_TEMPLATE_ORDER_OUT_FOR_DELIVERY",
    category: "UTILITY",
    body: "Your Spicy Nuts order #{{1}} is out for delivery today. {{2}}",
    example: ["1A2B3C4D", "Please keep ₹650 ready (cash or UPI)."],
  },
  order_delivery_failed: {
    env: "WA_TEMPLATE_ORDER_DELIVERY_FAILED",
    category: "UTILITY",
    body: "We couldn't deliver your Spicy Nuts order #{{1}} today. The courier will try again. To change the address or time, reply to this message. Track: {{2}}",
    example: ["1A2B3C4D", "https://www.spicynuts.in/track/abc"],
  },
  order_delivered: {
    env: "WA_TEMPLATE_ORDER_DELIVERED",
    category: "UTILITY",
    body: "Your Spicy Nuts order #{{1}} has been delivered. Any problem with it? Report it within 48 hours here: {{2}}",
    example: ["1A2B3C4D", "https://www.spicynuts.in/account/orders"],
  },
  order_cancelled: {
    env: "WA_TEMPLATE_ORDER_CANCELLED",
    category: "UTILITY",
    body: "Your Spicy Nuts order #{{1}} has been cancelled. {{2}}",
    example: ["1A2B3C4D", "Your refund has been initiated and will reach you in 5-7 business days."],
  },
  welcome: {
    env: "WA_TEMPLATE_WELCOME",
    category: "MARKETING",
    body: "Namaste {{1}}, welcome to Spicy Nuts! Use code {{2}} for 10% off your next order: {{3}}",
    example: ["Priya", "ROYAL10", "https://www.spicynuts.in/shop"],
  },
  offer: {
    env: "WA_TEMPLATE_OFFER",
    category: "MARKETING",
    body: "{{1}} — get {{2}}% off at Spicy Nuts with code {{3}}. Shop now: {{4}}",
    example: ["Diwali Harvest Sale", "15", "DIWALI15", "https://www.spicynuts.in/shop"],
  },
  new_release: {
    env: "WA_TEMPLATE_NEW_RELEASE",
    category: "MARKETING",
    body: "New at Spicy Nuts: {{1}} ({{2}}) at ₹{{3}}. See it here: {{4}}",
    example: ["Kashmiri Walnuts", "500g", "799", "https://www.spicynuts.in/product/kashmiri-walnuts"],
  },
  price_drop: {
    env: "WA_TEMPLATE_PRICE_DROP",
    category: "MARKETING",
    body: "Price drop! {{1}} is now ₹{{2}} (was ₹{{3}}). Order here: {{4}}",
    example: ["Kashmiri Walnuts", "699", "799", "https://www.spicynuts.in/product/kashmiri-walnuts"],
  },
  price_alert_subscribed: {
    env: "WA_TEMPLATE_PRICE_ALERT_SUBSCRIBED",
    category: "UTILITY",
    body: "You'll get a WhatsApp message when {{1}} (now ₹{{2}}) drops in price. View it: {{3}}",
    example: ["Kashmiri Walnuts", "799", "https://www.spicynuts.in/product/kashmiri-walnuts"],
  },
  owner_daily_summary: {
    env: "WA_TEMPLATE_OWNER_DAILY_SUMMARY",
    category: "UTILITY",
    body: "Spicy Nuts daily report for {{1}}: {{2}} orders, sales ₹{{3}}. To pack: {{4}}. Needs attention: {{5}}. Details: {{6}}",
    example: ["7 Oct", "12", "8,450", "5 orders", "3 low stock, 1 batch expiring", "https://www.spicynuts.in/admin"],
  },
};

export interface TemplateRef {
  key: TemplateKey;
  params: Array<string | number>;
}

/** Meta rejects template params with newlines/tabs or 4+ spaces in a row. */
function cleanParam(value: string | number) {
  return String(value ?? "").replace(/[\r\n\t]+/g, " · ").replace(/ {4,}/g, "   ").trim().slice(0, 1000) || "-";
}

/** Builds the Cloud API `template` object, or null if this template isn't configured yet. */
export function buildTemplatePayload(ref: TemplateRef) {
  const def = WA_TEMPLATES[ref.key];
  const name = process.env[def.env];
  if (!name) return null;
  return {
    name,
    language: { code: process.env.WA_TEMPLATE_LANGUAGE || "en" },
    components: [{ type: "body", parameters: ref.params.map((p) => ({ type: "text", text: cleanParam(p) })) }],
  };
}
