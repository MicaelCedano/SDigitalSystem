
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const query = 'Revisión completada';
  
  const results = await prisma.equipoHistorial.findMany({
    where: {
      observacion: { contains: 'Revisi' }
    },
    take: 20,
    include: {
      user: true,
      equipo: { select: { imei: true } }
    }
  });

  console.log(`Total entries with 'Revisi':`, results.length);
  results.forEach(r => {
    console.log(`- ID: ${r.id} | IMEI: ${r.equipo.imei} | Obs: "${r.observacion}" | User: ${r.user?.name}`);
  });
}

main().finally(() => prisma.$disconnect());
