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
    body: "Hi {{1}}, thank you for shopping with Spicy Nuts! Your order #{{2}} for ₹{{3}} is confirmed ({{4}}). You can track your order here: {{5}} We will message you again when it ships.",
    example: ["Priya", "1A2B3C4D", "650", "Cash on Delivery", "https://www.spicynuts.in/track/abc"],
  },
  order_shipped: {
    env: "WA_TEMPLATE_ORDER_SHIPPED",
    category: "UTILITY",
    body: "Good news! Your Spicy Nuts order #{{1}} has been shipped with {{2}} (AWB number {{3}}). Track your parcel here: {{4}} Thank you for choosing Spicy Nuts.",
    example: ["1A2B3C4D", "Xpressbees", "14150000000001", "https://www.xpressbees.com/shipment/tracking?awbNo=14150000000001"],
  },
  order_out_for_delivery: {
    env: "WA_TEMPLATE_ORDER_OUT_FOR_DELIVERY",
    category: "UTILITY",
    body: "Your Spicy Nuts order #{{1}} is out for delivery today. {{2}} Thank you for shopping with us.",
    example: ["1A2B3C4D", "Please keep ₹650 ready (cash or UPI)."],
  },
  order_delivery_failed: {
    env: "WA_TEMPLATE_ORDER_DELIVERY_FAILED",
    category: "UTILITY",
    body: "We could not deliver your Spicy Nuts order #{{1}} today. The courier will try again soon. To change the address or delivery time, reply to this message. Track your order here: {{2}} Thank you.",
    example: ["1A2B3C4D", "https://www.spicynuts.in/track/abc"],
  },
  order_delivered: {
    env: "WA_TEMPLATE_ORDER_DELIVERED",
    category: "UTILITY",
    body: "Your Spicy Nuts order #{{1}} has been delivered. We hope you enjoy it! If there is any problem with your order, please report it within 48 hours here: {{2}} Thank you for shopping with us.",
    example: ["1A2B3C4D", "https://www.spicynuts.in/account/orders"],
  },
  order_cancelled: {
    env: "WA_TEMPLATE_ORDER_CANCELLED",
    category: "UTILITY",
    body: "Your Spicy Nuts order #{{1}} has been cancelled. {{2}} If you have any questions, just reply to this message.",
    example: ["1A2B3C4D", "Your refund has been initiated and will reach you in 5-7 business days."],
  },
  welcome: {
    env: "WA_TEMPLATE_WELCOME",
    category: "MARKETING",
    body: "Namaste {{1}}, welcome to Spicy Nuts! As a welcome gift, use code {{2}} to get 10% off your next order. Start shopping here: {{3}} Happy snacking!",
    example: ["Priya", "ROYAL10", "https://www.spicynuts.in/shop"],
  },
  offer: {
    env: "WA_TEMPLATE_OFFER",
    category: "MARKETING",
    body: "Special offer from Spicy Nuts: {{1}}. Get {{2}}% off on premium dry fruits and nuts with code {{3}}. Shop now: {{4}} Offer valid while stocks last.",
    example: ["Diwali Harvest Sale", "15", "DIWALI15", "https://www.spicynuts.in/shop"],
  },
  new_release: {
    env: "WA_TEMPLATE_NEW_RELEASE",
    category: "MARKETING",
    body: "Something new has arrived at Spicy Nuts! Try our {{1}} in a {{2}} pack, now available at just ₹{{3}}. Take a look and order here: {{4}} Freshly packed for you.",
    example: ["Kashmiri Walnuts", "500g", "799", "https://www.spicynuts.in/product/kashmiri-walnuts"],
  },
  price_drop: {
    env: "WA_TEMPLATE_PRICE_DROP",
    category: "MARKETING",
    body: "Good news from Spicy Nuts! The price of {{1}} has dropped. It is now available at ₹{{2}} instead of ₹{{3}}. Order now before stocks run out: {{4}} Thank you for being with us.",
    example: ["Kashmiri Walnuts", "699", "799", "https://www.spicynuts.in/product/kashmiri-walnuts"],
  },
  price_alert_subscribed: {
    env: "WA_TEMPLATE_PRICE_ALERT_SUBSCRIBED",
    category: "UTILITY",
    body: "Thank you! We will send you a WhatsApp message as soon as the price of {{1}} (currently ₹{{2}}) drops. You can view the product here: {{3}} Team Spicy Nuts.",
    example: ["Kashmiri Walnuts", "799", "https://www.spicynuts.in/product/kashmiri-walnuts"],
  },
  owner_daily_summary: {
    env: "WA_TEMPLATE_OWNER_DAILY_SUMMARY",
    category: "UTILITY",
    body: "Good morning! Here is the Spicy Nuts daily report for {{1}}. Orders received: {{2}}. Total sales: ₹{{3}}. Orders waiting to be packed: {{4}}. Things that need your attention today: {{5}}. Open the admin panel for full details: {{6}} Have a great day.",
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
