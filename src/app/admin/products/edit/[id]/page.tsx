import { requirePagePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import EditProductForm from "./edit-product-form";
import { VariantsEditor } from "./variants-editor";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("catalog.manage");
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: { dietaryTags: true, variants: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { price: "asc" }] } }
  });

  if (!product) {
    notFound();
  }

  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const dietaryTags = await prisma.dietaryTag.findMany({ select: { id: true, name: true } });
  
  const formattedProduct = {
    ...product,
    images: JSON.parse(product.images),
    tags: product.tags ? product.tags.split(',') : [],
    hasSizes: product.variants.length > 0,
  };

  return (
    <>
      <EditProductForm product={formattedProduct} categories={categories} dietaryTags={dietaryTags} />
      <VariantsEditor productId={product.id} variants={JSON.parse(JSON.stringify(product.variants))} />
    </>
  );
}
