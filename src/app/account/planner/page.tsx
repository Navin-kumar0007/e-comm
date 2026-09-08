'use client';

import Image from "next/image";
import { useState, useEffect } from 'react';
import { Plus, Calendar, ShoppingCart, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function MealPlannerPage() {
  const [plan, setPlan] = useState<Record<string, any[]>>({});
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');

  useEffect(() => {
    // Fetch recipes for the selector
    fetch('/api/planner/recipes')
      .then(res => res.json())
      .then(data => setRecipes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
      
    // In a real app, fetch the saved plan from DB here
  }, []);

  const openModal = (day: string) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  };

  const addRecipeToDay = (recipe: any) => {
    setPlan(prev => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), recipe]
    }));
    setIsModalOpen(false);
    toast.success(`Added ${recipe.title} to ${selectedDay}`);
  };

  const removeRecipe = (day: string, index: number) => {
    setPlan(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };

  const addAllToCart = () => {
    toast.success("All ingredients for the week added to cart!");
    // In reality, this would fetch ingredients for all recipes and push to cart
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold">Weekly Meal Planner</h1>
          <p className="text-muted-foreground">Plan your week and auto-generate your grocery list.</p>
        </div>
        <Button onClick={addAllToCart} className="bg-primary hover:bg-primary/90">
          <ShoppingCart className="w-4 h-4 mr-2" /> Buy Groceries
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {DAYS.map(day => (
          <div key={day} className="bg-card border border-border/50 rounded-2xl p-4 min-h-[200px] flex flex-col">
            <h3 className="font-semibold text-center pb-3 border-b border-border/50 mb-3 text-primary">{day}</h3>
            
            <div className="flex-1 space-y-3">
              {(plan[day] || []).map((recipe, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-border/50 bg-background">
                  <Image width={800} height={800} unoptimized={false} src={recipe.image} alt={recipe.title} className="w-full h-20 object-cover opacity-80" />
                  <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                    <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{recipe.title}</p>
                  </div>
                  <button 
                    onClick={() => removeRecipe(day, i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-destructive/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-3 rounded-xl border-dashed hover:bg-primary/5"
              onClick={() => openModal(day)}
            >
              <Plus className="w-4 h-4 mr-2" /> Add
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to {selectedDay}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2">
            {recipes.map(recipe => (
              <div 
                key={recipe.id} 
                onClick={() => addRecipeToDay(recipe)}
                className="flex items-center gap-3 p-2 rounded-xl border border-border/50 hover:bg-primary/5 cursor-pointer transition-colors"
              >
                <Image width={800} height={800} unoptimized={false} src={recipe.image} alt={recipe.title} className="w-16 h-16 rounded-lg object-cover" />
                <div>
                  <h4 className="font-semibold text-sm">{recipe.title}</h4>
                  <p className="text-xs text-muted-foreground">{recipe.prepTime} prep</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
