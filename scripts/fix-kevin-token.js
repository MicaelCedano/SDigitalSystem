const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')
const prisma = new PrismaClient()

async function main() {
    const transactionId = 700
    const token = crypto.randomBytes(32).toString('hex')
    
    const updated = await prisma.walletTransaction.update({
        where: { id: transactionId },
        data: {
            secureToken: token
        }
    })

    console.log('--- TRANSACTION UPDATED ---')
    console.log(JSON.stringify(updated, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
