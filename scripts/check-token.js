const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const transactionId = 700
    const t = await prisma.walletTransaction.findUnique({
        where: { id: transactionId }
    })

    console.log('--- TRANSACTION 700 DETAILS ---')
    console.log(JSON.stringify(t, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
