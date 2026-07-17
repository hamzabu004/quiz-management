import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultUserId = '00000000-0000-0000-0000-000000000001';

  const user = await prisma.user.upsert({
    where: { id: defaultUserId },
    update: {},
    create: {
      id: defaultUserId,
      email: 'system@internal',
      displayName: 'Default User',
    },
  });

  console.log('Seeded default user:', user);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
