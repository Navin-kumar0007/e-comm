import { RecipeForm } from '../../recipe-form';
import { prisma } from '@/lib/db/prisma';
import { getRecipe } from '@/app/actions/admin-recipes';
import { notFound } from 'next/navigation';

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const products = await prisma.product.findMany({ select: { id: true, name: true } });
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold mb-2">Edit Recipe</h1>
      </div>
      <RecipeForm initialData={recipe} products={products} />
    </div>
  );
}
