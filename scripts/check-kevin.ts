import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const userId = 2
    const kevin = await prisma.user.findUnique({ where: { id: userId } })
    console.log(`Kevin Info: ${JSON.stringify(kevin, null, 2)}`)

    const lastTransactions = await prisma.transaction.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10
    })

    console.log('--- RECENT TRANSACTIONS ---')
    lastTransactions.forEach(t => {
        console.log(`${t.id} | ${t.amount} | ${t.type} | ${t.status} | ${t.createdAt.toISOString()} | ${t.description}`)
    })
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
