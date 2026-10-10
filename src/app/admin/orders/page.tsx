import { requirePagePermission } from "@/lib/auth-guard";
import { getAdminOrders } from "@/app/actions/admin-orders";
import OrdersClient from "./orders-client";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; status?: string; channel?: string }> }) {
  await requirePagePermission("orders.view");
  const sp = await searchParams;
  const data = await getAdminOrders({ page: Number(sp.page) || 1, q: sp.q, status: sp.status, channel: sp.channel });
  return (
    <OrdersClient
      initialOrders={data.orders}
      total={data.total}
      page={data.page}
      pageSize={data.pageSize}
      counts={data.counts}
      status={sp.status ?? "all"}
      query={sp.q ?? ""}
      channel={sp.channel ?? ""}
    />
  );
}
