import { requirePagePermission } from "@/lib/auth-guard";
import { getConversations } from "@/app/actions/admin-inbox";
import { InboxClient } from "./inbox-client";

export const dynamic = "force-dynamic";

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ phone?: string }> }) {
  await requirePagePermission("customers.view");
  const [conversations, { phone }] = await Promise.all([getConversations(), searchParams]);
  return <InboxClient initial={conversations} initialPhone={phone ?? conversations[0]?.phone ?? null} />;
}
