// Finishes registering the business number on the WhatsApp Cloud API (fixes status "Pending").
//
// Run in your own Terminal:
//   read -s WA_TOKEN && export WA_TOKEN      # paste the permanent token, press Enter
//   read -s WA_PIN && export WA_PIN          # type a 6-digit PIN you choose, press Enter (keep it safe:
//                                            # it becomes the number's two-step PIN)
//   npx tsx scripts/register-whatsapp-number.mts <PHONE_NUMBER_ID>
//
// PHONE_NUMBER_ID is shown under "From" on the API Setup page (not the phone number itself).

const token = process.env.WA_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
const pin = process.env.WA_PIN;
const id = process.argv[2] || process.env.WHATSAPP_PHONE_NUMBER_ID;
if (!token || !id || !pin || !/^\d{6}$/.test(pin)) {
  console.error("Need WA_TOKEN, a 6-digit WA_PIN and the Phone number ID. See the top of this file.");
  process.exit(1);
}

const res = await fetch(`https://graph.facebook.com/v21.0/${id}/register`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ messaging_product: "whatsapp", pin }),
});
const json: any = await res.json();
if (json.error) console.log(`✗ ${json.error.error_user_msg || json.error.message} (code ${json.error.code})`);
else console.log("✓ Number registered. Status should change to Connected within a few minutes.");

const info: any = await (await fetch(`https://graph.facebook.com/v21.0/${id}?fields=display_phone_number,verified_name,name_status,status,quality_rating`, { headers: { Authorization: `Bearer ${token}` } })).json();
if (!info.error) console.log(`  ${info.display_phone_number} · ${info.verified_name} · name ${info.name_status} · status ${info.status ?? "—"}`);
