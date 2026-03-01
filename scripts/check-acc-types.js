
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("Checking Wallet Accounts Types...")
    try {
        const accounts = await prisma.walletAccount.findMany({
            take: 20
        });

        accounts.forEach(acc => {
            console.log(`Account Name: ${acc.nombre} | Type: ${acc.tipo} | Balance: ${acc.saldo}`)
        });

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
