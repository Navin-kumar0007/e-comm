const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    }
  });
  
  console.log("=== CATEGORIES IN DATABASE ===");
  categories.forEach(c => {
    console.log(`- ${c.name} (${c.slug}): ${c._count.products} products`);
  });

  const products = await prisma.product.findMany({
    select: { name: true, category: { select: { name: true } } },
    orderBy: { categoryId: 'asc' }
  });

  console.log("\n=== ALL PRODUCTS IN DATABASE ===");
  let currentCategory = "";
  products.forEach(p => {
    if (p.category.name !== currentCategory) {
      currentCategory = p.category.name;
      console.log(`\n[${currentCategory}]`);
    }
    console.log(`  - ${p.name}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
