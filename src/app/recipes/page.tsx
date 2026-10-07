import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/prisma";
import { PageHero } from "@/components/storefront/royal/page-hero";

export const metadata = {
  title: "Traditional Indian Recipes — Dry Fruits, Masalas & Healthy Cooking",
  description: "Explore authentic Indian recipes featuring premium dry fruits, handcrafted masalas, and organic spices. From golden milk to masala chai, cook with the finest ingredients.",
};

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <>
      <PageHero eyebrow={"From our kitchen"} title={"Authentic Recipes"} subtitle={"Discover traditional Indian recipes crafted with our premium, organic spices. Bring the authentic taste of Spicy Nuts to your home."} crumbs={[{ label: "Home", href: "/" }, { label: "Recipes" }]} />
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-8 md:pb-10">
      <div className="max-w-3xl mx-auto text-center mb-8">
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {recipes.map((recipe) => (
          <Link href={`/recipes/${recipe.slug}`} key={recipe.id} className="group block">
            <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/30 h-full flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image width={800} height={800} unoptimized={false} src={recipe.image && !recipe.image.includes("placehold.co") ? recipe.image : "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=800&auto=format&fit=crop"} 
                  alt={recipe.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <Badge className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white border-none">
                  {recipe.category}
                </Badge>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-xl font-heading font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  {recipe.title}
                </h3>
                
                <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
                  {recipe.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mt-auto border-t border-border/50 pt-4">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> {recipe.cookTime}</span>
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> {recipe.servings} serves</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
    </>
  );
}
