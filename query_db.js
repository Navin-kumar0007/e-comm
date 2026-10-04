const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const subs = await prisma.whatsAppSubscriber.findMany();
  console.log("Subscribers:", subs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
