import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/prisma";

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-8 md:pt-28 md:pb-10">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold mb-3 text-foreground">
          Authentic <span className="text-primary italic">Recipes</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Discover traditional Indian recipes crafted with our premium, organic spices. Bring the authentic taste of Spicy Nuts to your home.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {recipes.map((recipe) => (
          <Link href={`/recipes/${recipe.slug}`} key={recipe.id} className="group block">
            <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/30 h-full flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image width={800} height={800} unoptimized={false} src={recipe.image} 
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
  );
}
