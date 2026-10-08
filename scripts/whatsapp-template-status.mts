// Shows the review status of every WhatsApp template.
//   read -s WA_TOKEN && export WA_TOKEN      (only if this Terminal window doesn't have it yet)
//   npx tsx scripts/whatsapp-template-status.mts

const token = process.env.WA_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
const waba = process.argv[2] || process.env.WHATSAPP_WABA_ID || "1412658055006813";
if (!token) {
  console.error("Missing token. Run: read -s WA_TOKEN && export WA_TOKEN");
  process.exit(1);
}
const res: any = await (await fetch(`https://graph.facebook.com/v21.0/${waba}/message_templates?fields=name,status,category,rejected_reason&limit=200`, { headers: { Authorization: `Bearer ${token}` } })).json();
if (res.error) {
  console.error(res.error.message);
  process.exit(1);
}
const mark: Record<string, string> = { APPROVED: "✓ Active", PENDING: "… In review", REJECTED: "✗ Rejected", PAUSED: "‖ Paused", DISABLED: "✗ Disabled" };
for (const t of res.data ?? []) {
  console.log(`${(mark[t.status] ?? t.status).padEnd(12)} ${t.name.padEnd(26)} ${t.category}${t.rejected_reason && t.rejected_reason !== "NONE" ? `  reason: ${t.rejected_reason}` : ""}`);
}
