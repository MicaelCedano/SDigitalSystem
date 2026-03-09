
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const imei = '354070966714722';
  
  const results = await prisma.equipoHistorial.findMany({
    where: {
      equipo: { imei },
      observacion: { contains: 'completada' }
    },
    include: {
      user: true
    }
  });

  console.log(`Matching history entries for IMEI ${imei}:`, results.length);
  results.forEach(r => {
    console.log(`- ID: ${r.id} | Obs: "${r.observacion}" | User: ${r.user?.name}`);
  });
}

main().finally(() => prisma.$disconnect());
