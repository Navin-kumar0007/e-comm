import { getAdminProducts } from "@/app/actions/admin-products";
import { getAdminSettings } from "@/app/actions/admin-settings";
import NewOrderForm from "./new-order-form";

export default async function NewOrderPage() {
  const products = await getAdminProducts();
  const settings = await getAdminSettings();
  
  const formattedProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
    weight: p.weight || '250g'
  }));

  return <NewOrderForm products={formattedProducts} settings={settings} />;
}
