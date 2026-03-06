
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Searching for equipments moved from #61...");
    // History records usually say "Ingreso inicial por compra #61" or similar
    const hist = await prisma.equipoHistorial.findMany({
        where: {
            observacion: {
                contains: "61"
            }
        },
        include: {
            equipo: true
        }
    });

    const moved = hist.filter(h => h.equipo && h.equipo.purchaseId !== 61);
    console.log(`Found ${moved.length} moved equipments from historical records mentionining '61'`);
    moved.forEach(m => {
        console.log(`IMEI: ${m.equipo?.imei}, Original Note: ${m.observacion}, Current PurchaseId: ${m.equipo?.purchaseId}`);
    });

    // Also check for general missing items by counting
    const oldPids = [61, 60, 58, 53, 51, 38];
    for (const pid of oldPids) {
        const p = await prisma.purchase.findUnique({ where: { id: pid } });
        const count = await prisma.equipo.count({ where: { purchaseId: pid } });
        console.log(`Purchase #${pid}: DB Total=${p?.totalQuantity}, Table Count=${count}, Diff=${(p?.totalQuantity || 0) - count}`);
    }
}

main()
