import { RecipeForm } from '../recipe-form';
import { prisma } from '@/lib/db/prisma';

export default async function NewRecipePage() {
  const products = await prisma.product.findMany({ select: { id: true, name: true } });
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold mb-2">Create Recipe</h1>
      </div>
      <RecipeForm products={products} />
    </div>
  );
}
