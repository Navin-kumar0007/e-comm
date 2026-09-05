import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import RecipePrintClient from "./recipe-print-client";

export default async function RecipePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id: resolvedParams.id },
    include: {
      products: true
    }
  });

  if (!recipe) {
    return notFound();
  }

  // Parse JSON strings
  const parsedRecipe = {
    ...recipe,
    ingredients: JSON.parse(recipe.ingredients || '[]'),
    steps: JSON.parse(recipe.steps || '[]')
  };

  return <RecipePrintClient recipe={parsedRecipe} />;
}
