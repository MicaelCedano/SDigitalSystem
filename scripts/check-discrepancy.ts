
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const pid = 61;
    const summary = await prisma.purchaseItem.findMany({ where: { purchaseId: pid } });
    console.log("PurchaseItem Summary for #61:", summary.map(s => ({ modelId: s.deviceModelId, quantity: s.quantity })));

    const equips = await prisma.equipo.findMany({ where: { purchaseId: pid } });
    const counts: Record<number, number> = {};
    equips.forEach(e => {
        if (e.deviceModelId) counts[e.deviceModelId] = (counts[e.deviceModelId] || 0) + 1;
    });
    console.log("Actual Equipo counts by model for #61:", counts);
}

main()
