import { requirePagePermission } from "@/lib/auth-guard";
import NewProductForm from "./new-product-form";
import { prisma } from "@/lib/db/prisma";

export default async function NewProductPage() {
  await requirePagePermission("catalog.manage");
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const dietaryTags = await prisma.dietaryTag.findMany({ select: { id: true, name: true } });
  
  return <NewProductForm categories={categories} dietaryTags={dietaryTags} />;
}
