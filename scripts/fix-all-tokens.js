const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')
const prisma = new PrismaClient()

async function main() {
    // Find all transactions of type 'retiro' or 'ingreso' that are approved/completed but missing a secureToken
    const txs = await prisma.walletTransaction.findMany({
        where: {
            secureToken: null,
            estado: { in: ['Aprobado', 'Completado'] }
        }
    })

    console.log(`Found ${txs.length} transactions missing secureToken.`)

    for (const t of txs) {
        const token = crypto.randomBytes(32).toString('hex')
        await prisma.walletTransaction.update({
            where: { id: t.id },
            data: { secureToken: token }
        })
        console.log(`Updated transaction ${t.id} with new token.`)
    }

    console.log('All transactions fixed.')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
