import { requirePagePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { AuditClient } from "./audit-client";

export const dynamic = "force-dynamic";
const PAGE = 100;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ q?: string; area?: string; who?: string; page?: string }> }) {
  await requirePagePermission("staff.manage");
  const { q = "", area = "", who = "", page = "1" } = await searchParams;
  const p = Math.max(1, parseInt(page) || 1);
  const where: any = {
    ...(area ? { action: { startsWith: `${area}.` } } : {}),
    ...(who ? { actor: who } : {}),
    ...(q ? { OR: [{ summary: { contains: q, mode: "insensitive" } }, { entityId: q }, { actor: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [rows, total, actors] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (p - 1) * PAGE, take: PAGE }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({ by: ["actor"], _count: { _all: true }, orderBy: { _count: { actor: "desc" } }, take: 30 }),
  ]);
  return (
    <AuditClient
      rows={JSON.parse(JSON.stringify(rows))}
      total={total}
      page={p}
      pageSize={PAGE}
      filters={{ q, area, who }}
      actors={actors.map((a: any) => a.actor)}
    />
  );
}
