
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const pSum = await prisma.purchase.aggregate({
        _sum: { totalQuantity: true },
        where: { estado: { not: "borrador" } }
    });
    const eCount = await prisma.equipo.count();
    console.log("Sum of Purchase.totalQuantity (active/history):", pSum._sum.totalQuantity);
    console.log("Total Equipos in table:", eCount);
    console.log("Difference:", (pSum._sum.totalQuantity || 0) - eCount);
}

main()
