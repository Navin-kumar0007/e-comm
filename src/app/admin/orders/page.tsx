import { getAdminOrders } from "@/app/actions/admin-orders";
import OrdersClient from "./orders-client";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();
  return <OrdersClient initialOrders={orders} />;
}
