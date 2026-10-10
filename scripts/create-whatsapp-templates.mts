// Creates every WhatsApp message template the website uses, in one go, via Meta's Graph API.
//
// Run in your own Terminal (the token never needs to be shown to anyone):
//   cd <project folder>
//   read -s WA_TOKEN && export WA_TOKEN        # paste the permanent token, press Enter (nothing is shown)
//   npx tsx scripts/create-whatsapp-templates.mts
//
// It finds the WhatsApp Business Account that holds 85500 07073 by itself; you can also pass its ID at the end.
// Templates that already exist are skipped. Each new one goes to Meta for review (minutes to a day).

import { WA_TEMPLATES } from "../src/lib/whatsapp-templates";

const token = process.env.WA_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
const lang = process.env.WA_TEMPLATE_LANGUAGE || "en";
const BUSINESS_ID = "2628755830928248"; // Spicy Nuts in Meta Business Suite
if (!token) {
  console.error("Missing token. Run: read -s WA_TOKEN && export WA_TOKEN");
  process.exit(1);
}
const get = async (path: string) => (await fetch(`https://graph.facebook.com/v21.0/${path}`, { headers: { Authorization: `Bearer ${token}` } })).json() as Promise<any>;

/** Finds the WhatsApp Business Account that holds the given number, or accepts an ID passed in. */
async function findAccount(): Promise<string | null> {
  const given = process.argv[2] || process.env.WHATSAPP_WABA_ID;
  if (given && /^\d+$/.test(given) && given.length > 12) {
    const probe = await get(`${given}?fields=id,name`);
    if (!probe.error) return given;
  }
  for (const edge of ["owned_whatsapp_business_accounts", "client_whatsapp_business_accounts"]) {
    const res = await get(`${BUSINESS_ID}/${edge}?fields=id,name,phone_numbers{display_phone_number}`);
    for (const w of res.data ?? []) {
      const nums = (w.phone_numbers?.data ?? []).map((p: any) => p.display_phone_number.replace(/\D/g, ""));
      if (nums.some((n: string) => n.endsWith("8550007073"))) return w.id;
    }
  }
  return null;
}

const waba = await findAccount();
if (!waba) {
  console.error("Couldn't find the WhatsApp Business Account for 85500 07073.");
  console.error("Copy 'WhatsApp Business Account ID' from developers.facebook.com → your app → WhatsApp → API Setup and run:");
  console.error("  npx tsx scripts/create-whatsapp-templates.mts THAT_ID");
  process.exit(1);
}
console.log(`Using WhatsApp Business Account ${waba}`);

const api = `https://graph.facebook.com/v21.0/${waba}/message_templates`;
const existing = new Set<string>();
{
  const json: any = await get(`${waba}/message_templates?fields=name,status&limit=200`);
  if (json.error) {
    console.error(`Could not read templates: ${json.error.message}`);
    process.exit(1);
  }
  for (const t of json.data ?? []) existing.add(t.name);
}

for (const [name, t] of Object.entries(WA_TEMPLATES)) {
  if (existing.has(name)) {
    console.log(`= ${name}: already exists, skipped`);
    continue;
  }
  const body = {
    name,
    language: lang,
    category: t.category,
    components: [
      { type: "BODY", text: t.body, example: { body_text: [t.example.map(String)] } },
      ...(t.quickReplies?.length ? [{ type: "BUTTONS", buttons: t.quickReplies.map((text) => ({ type: "QUICK_REPLY", text })) }] : []),
    ],
  };
  const res = await fetch(api, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json: any = await res.json();
  if (json.error) console.log(`✗ ${name}: ${json.error.error_user_msg || json.error.message}`);
  else console.log(`✓ ${name}: submitted (${json.status ?? "PENDING"}) → in Vercel set ${t.env} = ${name}`);
}
