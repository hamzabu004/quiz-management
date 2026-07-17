import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import prisma from './src/lib/prisma.js';

async function main() {
  const result = await prisma.classroom.create({
    data: { classroomName: 'Test Class' }
  });
  console.log('Created:', result);
}
main().finally(() => prisma.$disconnect());
