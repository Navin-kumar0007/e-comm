import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

// DATABASE_URL is a prisma+postgres:// (Accelerate) URL, so the extension is
// required at runtime. Its result types break include/groupBy inference on
// Prisma 5, and no Accelerate-only APIs (cacheStrategy, $accelerate) are used,
// so the client is exposed with plain PrismaClient types.
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  }).$extends(withAccelerate()) as unknown as PrismaClient
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
