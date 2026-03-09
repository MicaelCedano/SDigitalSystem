
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hId = 35619;
  const entry = await prisma.equipoHistorial.findUnique({
    where: { id: hId },
    include: { user: true }
  });
  console.log(`History ID ${hId}:`, entry);
}

main().finally(() => prisma.$disconnect());
