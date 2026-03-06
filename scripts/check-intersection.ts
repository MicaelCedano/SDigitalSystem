
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Checking for IMEI intersection between #88 and others...");
    const p88 = await prisma.equipo.findMany({ where: { purchaseId: 88 } });
    const p88imeis = p88.map(i => i.imei);

    // We already know unique constraint prevents same IMEI in 2 records.
    // So we check historial of P88 for mentions of other purchases.
    const hist = await prisma.equipoHistorial.findMany({
        where: {
            equipoId: { in: p88.map(e => e.id) },
            observacion: { contains: "#" }
        }
    });

    console.log(`Found ${hist.length} history records in #88 equipments that mention other purchases.`);
    hist.forEach(h => {
        console.log(`Equipo ${h.equipoId}: ${h.observacion}`);
    });

    // Also check if any equipment currently has no purchaseId (should be impossible)
    // and if any purchase has equipments in table that are NOT accounted for.
}

main()
