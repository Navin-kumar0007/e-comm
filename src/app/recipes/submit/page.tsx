'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submitRecipe } from '@/app/actions/admin-recipes';
import { toast } from 'sonner';

export default function SubmitRecipe() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await submitRecipe(data);
      toast.success("Recipe submitted successfully! Waiting for admin approval.");
      router.push('/recipes');
    } catch (err) {
      toast.error("Failed to submit recipe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-12 pt-28 md:pt-36">
      <h1 className="text-4xl font-heading font-bold mb-2">Share Your Recipe</h1>
      <p className="text-zinc-500 mb-8">Got a secret family recipe using our masalas? Share it with the community!</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Recipe Title</label>
          <Input name="title" required placeholder="e.g. Spicy Mango Chicken" />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Input name="description" required placeholder="A brief description..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select name="category" className="w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent">
              <option value="Main Course">Main Course</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Snacks">Snacks</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <select name="difficulty" className="w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent">
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prep Time</label>
            <Input name="prepTime" required placeholder="15 mins" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cook Time</label>
            <Input name="cookTime" required placeholder="30 mins" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Servings</label>
            <Input name="servings" type="number" required placeholder="4" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Ingredients (comma separated)</label>
          <Input name="ingredients" required placeholder="2 cups rice, 1 tbsp masala..." />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Steps (one per line)</label>
          <textarea name="steps" required className="w-full min-h-[100px] p-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent" placeholder="1. Wash rice\n2. Add spices..."></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
          <Input name="tags" required placeholder="spicy, vegan, quick" />
        </div>

        <Button type="submit" className="w-full bg-[#4A5D23] hover:bg-[#3A4D13] text-white" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Recipe for Review'}
        </Button>
      </form>
    </div>
  );
}
