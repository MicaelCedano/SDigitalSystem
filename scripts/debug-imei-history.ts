
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const imei = '354070966714722';
  console.log(`Buscando IMEI: ${imei}`);
  
  const equipo = await prisma.equipo.findUnique({
    where: { imei },
    include: {
      historial: {
        orderBy: { fecha: 'desc' },
        include: { user: true }
      }
    }
  });

  if (!equipo) {
    console.log('Equipo no encontrado');
    return;
  }

  console.log('Equipo:', {
    id: equipo.id,
    modelo: equipo.modelo,
    observacion: equipo.observacion,
    estado: equipo.estado
  });

  console.log('Historial:');
  equipo.historial.forEach(h => {
    console.log(`- ID: ${h.id} | Fecha: ${h.fecha} | Estado: ${h.estado} | Usuario: ${h.user?.name || h.user?.username} (${h.user?.role}) | Obs: ${h.observacion}`);
  });
}

main().finally(() => prisma.$disconnect());
