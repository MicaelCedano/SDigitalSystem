
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const groups = await prisma.equipo.groupBy({
        by: ['purchaseId'],
        _count: { id: true }
    });
    console.log("PurchaseId distribution in Equipo table:");
    groups.sort((a, b) => b.purchaseId - a.purchaseId).forEach(g => {
        console.log(`Purchase #${g.purchaseId}: ${g._count.id} equipments`);
    });
}

main()
