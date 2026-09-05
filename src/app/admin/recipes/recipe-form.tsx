'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createRecipe, updateRecipe } from '@/app/actions/admin-recipes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function RecipeForm({ initialData = null, products = [] }: { initialData?: any, products: any[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    image: initialData?.image || '/placeholder.jpg',
    category: initialData?.category || 'Main Course',
    prepTime: initialData?.prepTime || '15 mins',
    cookTime: initialData?.cookTime || '30 mins',
    servings: initialData?.servings || 4,
    difficulty: initialData?.difficulty || 'Medium',
    ingredients: initialData?.ingredients ? JSON.parse(initialData.ingredients) : [{ item: '', amount: '' }],
    steps: initialData?.steps ? JSON.parse(initialData.steps) : [''],
    tags: initialData?.tags || '',
    productIds: initialData?.products?.map((p: any) => p.id) || []
  });

  const generateSlug = (val: string) => {
    setFormData(prev => ({ ...prev, slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }));
  };

  const handleIngredientChange = (index: number, field: string, value: string) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index][field] = value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const addIngredient = () => setFormData({ ...formData, ingredients: [...formData.ingredients, { item: '', amount: '' }] });
  
  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  const addStep = () => setFormData({ ...formData, steps: [...formData.steps, ''] });

  const toggleProduct = (id: string) => {
    const ids = formData.productIds;
    if (ids.includes(id)) {
      setFormData({ ...formData, productIds: ids.filter((pid: string) => pid !== id) });
    } else {
      setFormData({ ...formData, productIds: [...ids, id] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        ingredients: JSON.stringify(formData.ingredients),
        steps: JSON.stringify(formData.steps),
        servings: Number(formData.servings)
      };

      if (initialData) {
        await updateRecipe(initialData.id, payload);
        toast.success('Recipe updated!');
      } else {
        await createRecipe(payload);
        toast.success('Recipe created!');
      }
      router.push('/admin/recipes');
    } catch (error) {
      toast.error('Failed to save recipe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-muted/30 p-8 rounded-2xl border border-border/50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <Input value={formData.title} onChange={e => { setFormData({...formData, title: e.target.value}); if(!initialData) generateSlug(e.target.value); }} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Image URL</label>
          <Input value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Prep Time</label>
          <Input value={formData.prepTime} onChange={e => setFormData({...formData, prepTime: e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cook Time</label>
          <Input value={formData.cookTime} onChange={e => setFormData({...formData, cookTime: e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Servings</label>
          <Input type="number" value={formData.servings} onChange={e => setFormData({...formData, servings: e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Difficulty</label>
          <Input value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} required />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Ingredients List</h3>
        {formData.ingredients.map((ing: any, idx: number) => (
          <div key={idx} className="flex gap-4">
            <Input placeholder="Amount (e.g. 2 tbsp)" value={ing.amount} onChange={e => handleIngredientChange(idx, 'amount', e.target.value)} className="w-1/3" />
            <Input placeholder="Item (e.g. Turmeric)" value={ing.item} onChange={e => handleIngredientChange(idx, 'item', e.target.value)} className="flex-1" />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addIngredient}>+ Add Ingredient</Button>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Steps</h3>
        {formData.steps.map((step: any, idx: number) => (
          <div key={idx} className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">{idx + 1}</div>
            <Textarea placeholder="Describe this step..." value={step} onChange={e => handleStepChange(idx, e.target.value)} className="flex-1" />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addStep}>+ Add Step</Button>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Linked Store Products (Shoppable)</h3>
        <p className="text-sm text-muted-foreground">Select products from your store that this recipe uses. Customers can add them to their cart directly from the recipe page.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto p-4 border rounded-xl bg-background">
          {products.map((p: any) => (
            <label key={p.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <input type="checkbox" checked={formData.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} className="w-4 h-4 rounded text-primary" />
              <div className="text-sm font-medium">{p.name}</div>
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : (initialData ? 'Update Recipe' : 'Create Recipe')}
      </Button>
    </form>
  );
}
