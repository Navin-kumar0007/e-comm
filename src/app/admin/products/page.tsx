import { getAdminProducts } from "@/app/actions/admin-products";
import AdminProductsClient from "./products-client";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();
  
  // Format the products for the client component
  const formattedProducts = products.map(p => ({
    ...p,
    images: JSON.parse(p.images),
    tags: p.tags ? p.tags.split(',') : []
  }));

  return <AdminProductsClient initialProducts={formattedProducts} />;
}
