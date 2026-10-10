// Sends WhatsApp templates with sample values to ONE number, to check how they look.
// Nothing goes to customers.
//
//   read -s WA_TOKEN && export WA_TOKEN       (only if this Terminal window doesn't have it yet)
//   npx tsx scripts/send-test-whatsapp.mts 919876543210              → sends all 12
//   npx tsx scripts/send-test-whatsapp.mts 919876543210 order_shipped → sends just one
//
// Cost: about ₹0.12 per utility and ₹0.80 per marketing message.

import { WA_TEMPLATES, buildTemplatePayload, type TemplateKey } from "../src/lib/whatsapp-templates";

const token = process.env.WA_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1394849203710879";
const to = (process.argv[2] || "").replace(/\D/g, "");
const only = process.argv[3] as TemplateKey | undefined;
if (!token || to.length < 12) {
  console.error("Usage: npx tsx scripts/send-test-whatsapp.mts 91XXXXXXXXXX [template_name]  (token from: read -s WA_TOKEN && export WA_TOKEN)");
  process.exit(1);
}
if (only && !(only in WA_TEMPLATES)) {
  console.error(`Unknown template "${only}". Names: ${Object.keys(WA_TEMPLATES).join(", ")}`);
  process.exit(1);
}

for (const [key, t] of Object.entries(WA_TEMPLATES)) {
  if (only && key !== only) continue;
  // Approved template name = key (as created by create-whatsapp-templates.mts).
  process.env[t.env] = process.env[t.env] || key;
  const template = buildTemplatePayload({ key: key as TemplateKey, params: t.example });
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "template", template }),
  });
  const json: any = await res.json();
  if (json.error) console.log(`✗ ${key}: ${json.error.error_data?.details || json.error.message} (code ${json.error.code})`);
  else console.log(`✓ ${key}: sent (${t.category === "UTILITY" ? "utility" : "marketing"})`);
  await new Promise((r) => setTimeout(r, 1500));
}
