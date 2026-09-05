import { PrismaClient } from '@prisma/client'
import { mockCategories, mockProducts } from '../src/lib/mock-data'
import { recipes } from '../src/lib/recipes-data'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // 1. Seed Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nuttyworld.com' },
    update: {},
    create: {
      email: 'admin@nuttyworld.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })
  console.log(`Created admin user: ${admin.email}`)

  // 2. Seed Categories
  for (const c of mockCategories) {
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: (c as any).image || null,
      },
    })
    console.log(`Created category: ${category.name}`)
  }

  // 3. Seed Products
  for (const p of mockProducts) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: Number(p.price),
        salePrice: p.salePrice ? Number(p.salePrice) : null,
        images: JSON.stringify(p.images),
        weight: p.weight,
        isOrganic: p.isOrganic,
        isFeatured: p.isFeatured || false,
        tags: (p.tags || []).join(','),
        categoryId: p.categoryId,
      },
    })
    console.log(`Created product: ${product.name}`)
  }

  // 4. Seed Recipes
  for (const r of recipes) {
    const recipe = await prisma.recipe.upsert({
      where: { slug: r.slug },
      update: {},
      create: {
        slug: r.slug,
        title: r.title,
        description: r.description,
        image: r.image,
        category: r.category,
        prepTime: r.prepTime,
        cookTime: r.cookTime,
        servings: r.servings,
        difficulty: r.difficulty,
        ingredients: JSON.stringify(r.ingredients),
        steps: JSON.stringify(r.steps),
        tags: (r.tags || []).join(','),
      },
    })
    console.log(`Created recipe: ${recipe.title}`)
  }

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
