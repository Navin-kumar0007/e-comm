import { requirePagePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { getStoreSettings } from "@/lib/store-settings";
import NewOrderForm from "./new-order-form";

export default async function NewOrderPage() {
  await requirePagePermission("orders.create");
  const [products, settings] = await Promise.all([
    prisma.product.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    getStoreSettings(),
  ]);

  const formattedProducts = products.map((p: any) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
    weight: p.weight || '250g'
  }));

  return <NewOrderForm products={formattedProducts} settings={settings} />;
}
