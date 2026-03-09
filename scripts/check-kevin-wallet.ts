import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const userId = 2
    const lastTransactions = await prisma.walletTransaction.findMany({
        where: { tecnicoId: userId },
        orderBy: { fecha: 'desc' },
        take: 10
    })

    console.log('--- RECENT WALLET TRANSACTIONS FOR KEVIN (ID 2) ---')
    lastTransactions.forEach(t => {
        console.log(`${t.id} | ${t.monto} | ${t.tipo} | ${t.estado} | ${t.canjeado} | ${t.fecha.toISOString()} | ${t.descripcion}`)
    })
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
