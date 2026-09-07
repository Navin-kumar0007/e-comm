import { getAdminCategories } from "@/app/actions/admin-categories";
import CategoriesClient from "./categories-client";

export const metadata = {
  title: "Category Management - Spicy Nuts Admin",
};

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();
  return <CategoriesClient initialCategories={categories} />;
}
