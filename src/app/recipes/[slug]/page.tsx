import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ChefHat, Users, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeAddToCart } from "@/components/storefront/recipe-add-to-cart";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/prisma";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { slug } });
  if (!recipe) return { title: "Recipe Not Found" };
  return {
    title: `${recipe.title} | Nutty World Recipes`,
    description: recipe.description,
  };
}

export default async function RecipeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = await prisma.recipe.findUnique({ 
    where: { slug },
    include: { products: true }
  });
  
  if (!recipe) notFound();

  const ingredients = JSON.parse(recipe.ingredients);
  const steps = JSON.parse(recipe.steps);
  const tags = recipe.tags ? recipe.tags.split(',') : [];

  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden mt-16 md:mt-20">
        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="container mx-auto max-w-4xl">
            <Link href="/recipes" className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Recipes
            </Link>
            <Badge className="mb-3 bg-white/20 text-white border-white/30">{recipe.category}</Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-white mb-2">{recipe.title}</h1>
            <p className="text-white/80 max-w-xl">{recipe.description}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 -mt-8 relative z-10">
        {/* Quick Info Bar */}
        <div className="flex gap-6 p-5 rounded-2xl bg-card border border-border/50 shadow-md mb-10 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-2 text-sm shrink-0">
            <Clock className="w-4 h-4 text-primary" />
            <div><div className="text-xs text-muted-foreground">Prep</div><div className="font-semibold">{recipe.prepTime}</div></div>
          </div>
          <div className="flex items-center gap-2 text-sm shrink-0">
            <Clock className="w-4 h-4 text-primary" />
            <div><div className="text-xs text-muted-foreground">Cook</div><div className="font-semibold">{recipe.cookTime}</div></div>
          </div>
          <div className="flex items-center gap-2 text-sm shrink-0">
            <Users className="w-4 h-4 text-primary" />
            <div><div className="text-xs text-muted-foreground">Servings</div><div className="font-semibold">{recipe.servings}</div></div>
          </div>
          <div className="flex items-center gap-2 text-sm shrink-0">
            <ChefHat className="w-4 h-4 text-primary" />
            <div><div className="text-xs text-muted-foreground">Difficulty</div><div className="font-semibold">{recipe.difficulty}</div></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Ingredients */}
          <div className="md:col-span-1">
            <div className="sticky top-32 space-y-6">
              <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
                <h2 className="text-xl font-heading font-bold mb-4">Ingredients</h2>
                <ul className="space-y-3 mb-6">
                  {ingredients.map((ing: any, i: number) => (
                    <li key={i} className="flex justify-between items-start text-sm">
                      <span>{ing.item}</span>
                      <span className="text-muted-foreground shrink-0 ml-2">{ing.amount}</span>
                    </li>
                  ))}
                </ul>
                
                {recipe.products.length > 0 && (
                  <div className="pt-4 border-t border-border/50">
                    <h3 className="text-sm font-semibold mb-3">Shop Ingredients</h3>
                    <div className="space-y-3 mb-4">
                      {recipe.products.map(p => (
                        <Link href={`/product/${p.slug}`} key={p.id} className="flex items-center gap-3 group">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border">
                            <img src={JSON.parse(p.images)[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{p.name}</p>
                            <p className="text-xs text-muted-foreground">₹{p.salePrice || p.price}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <RecipeAddToCart products={recipe.products} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-heading font-bold mb-6">Instructions</h2>
            <ol className="space-y-6">
              {steps.map((step: string, i: number) => (
                <li key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-muted-foreground leading-relaxed pt-1">{step}</p>
                </li>
              ))}
            </ol>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-border/50">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
