
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const username = 'Yude'
    console.log(`Checking all transactions for user: ${username}`)
    try {
        const user = await prisma.user.findFirst({
            where: { username },
            include: {
                wallet: { include: { accounts: true } },
                walletTransactions: { orderBy: { fecha: 'desc' } }
            }
        });

        if (!user) {
            console.log("User not found");
            return;
        }

        console.log(`User: ${user.name} | Wallet Balance: ${user.wallet[0]?.saldo} | Principal Balance: ${user.wallet[0]?.accounts.find(a => a.nombre === 'Principal')?.saldo}`)

        let calculatedBalance = 0;
        user.walletTransactions.forEach(t => {
            const amount = t.monto;
            if (t.tipo.toLowerCase() === 'ingreso' || t.tipo.toLowerCase() === 'ingreso manual') {
                calculatedBalance += amount;
            } else if (t.tipo.toLowerCase() === 'retiro' || t.tipo.toLowerCase() === 'transferencia') {
                calculatedBalance -= amount;
            }
            console.log(`[${t.tipo}] ${t.monto} | ${t.descripcion} | ${t.estado} | ${t.fecha}`)
        });

        console.log(`\nCalculated Balance from Transactions: RD$ ${calculatedBalance}`);

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
