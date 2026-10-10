import { requirePagePermission } from "@/lib/auth-guard";
import { getEditorData } from "@/app/actions/admin-content";
import { WebsiteEditor } from "./website-editor";

export const dynamic = "force-dynamic";

export default async function WebsitePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requirePagePermission("catalog.manage");
  const [data, { tab }] = await Promise.all([getEditorData(), searchParams]);
  return <WebsiteEditor data={data} initialTab={tab} />;
}
