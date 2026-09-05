import { getRecipes } from '@/app/actions/admin-recipes';
import { RecipesClient } from './recipes-client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default async function AdminRecipesPage() {
  const recipes = await getRecipes();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Recipes</h1>
          <p className="text-muted-foreground">Manage your shoppable recipes.</p>
        </div>
        <Link href="/admin/recipes/new">
          <Button><Plus className="w-4 h-4 mr-2" /> New Recipe</Button>
        </Link>
      </div>
      
      <RecipesClient initialRecipes={recipes} />
    </div>
  );
}
