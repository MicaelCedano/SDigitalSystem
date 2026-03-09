
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hId = 35797;
  console.log(`Buscando entrada de historial ID: ${hId}`);
  
  const entry = await prisma.equipoHistorial.findUnique({
    where: { id: hId },
    include: {
      equipo: {
        select: {
          imei: true,
          modelo: true,
          observacion: true
        }
      },
      user: true
    }
  });

  if (!entry) {
    console.log('Entrada no encontrada');
    return;
  }

  console.log('Datos actuales:', {
    id: entry.id,
    imei: entry.equipo.imei,
    usuario: entry.user?.name,
    obs_historial: entry.observacion,
    obs_equipo: entry.equipo.observacion
  });

  if (entry.equipo.observacion && entry.equipo.observacion !== entry.observacion) {
    console.log(`Corrigiendo historial con la observación del equipo: "${entry.equipo.observacion}"`);
    await prisma.equipoHistorial.update({
      where: { id: hId },
      data: { observacion: entry.equipo.observacion }
    });
    console.log('¡Corregido!');
  } else {
    console.log('No se detectó una observación diferente en el equipo para copiar.');
  }
}

main().finally(() => prisma.$disconnect());
