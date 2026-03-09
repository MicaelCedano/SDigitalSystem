
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const imei = '354070966714722';
  const newObservation = 'pantalla picada,bordes con golpes,91%.';

  console.log(`Buscando equipo con IMEI: ${imei}...`);

  const equipo = await prisma.equipo.findUnique({
    where: { imei },
    include: {
        historial: {
            include: { user: true }
        }
    }
  });

  if (!equipo) {
    console.error('Equipo no encontrado');
    return;
  }

  // 1. Force update Equipo
  await prisma.equipo.update({
    where: { id: equipo.id },
    data: { observacion: newObservation }
  });
  console.log('Equipo table updated.');

  // 2. Iterate and update history regardless of exact string match if it's the technician's record
  let count = 0;
  for (const entry of equipo.historial) {
    if (entry.user?.role !== 'admin' && entry.estado === 'Revisado') {
      console.log(`Found candidate history ID ${entry.id}. Current obs: "${entry.observacion}"`);
      await prisma.equipoHistorial.update({
        where: { id: entry.id },
        data: { observacion: newObservation }
      });
      console.log(`- Historial ID ${entry.id} updated.`);
      count++;
    }
  }

  console.log(`Total history entries updated: ${count}`);
}

main().finally(() => prisma.$disconnect());
