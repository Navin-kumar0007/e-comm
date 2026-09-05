import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import EditProductForm from "./edit-product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: { dietaryTags: true }
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
  };

  return <EditProductForm product={formattedProduct} categories={categories} dietaryTags={dietaryTags} />;
}
