import { PrismaClient } from '@prisma/client'
import { mockCategories, mockProducts } from '../src/lib/mock-data'
import { recipes } from '../src/lib/recipes-data'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Wipe existing products and categories
  await prisma.orderItem.deleteMany()
  await prisma.review.deleteMany()
  await prisma.priceAlert.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  // 1. Seed Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'spicynuts1973@gmail.com' },
    update: {},
    create: {
      email: 'spicynuts1973@gmail.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })
  console.log(`Created admin user: ${admin.email}`)

  // 2. Seed Categories
  for (const c of mockCategories) {
    const category = await prisma.category.create({
      data: {
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
    const product = await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: Number(p.price),
        salePrice: (p as any).salePrice ? Number((p as any).salePrice) : null,
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
