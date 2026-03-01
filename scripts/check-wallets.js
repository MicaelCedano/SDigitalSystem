
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("Checking Wallet Transactions and Balances...")
    try {
        const users = await prisma.user.findMany({
            where: {
                role: { in: ["tecnico", "tecnico_garantias", "control_calidad"] }
            },
            include: {
                wallet: {
                    include: {
                        accounts: true
                    }
                },
                walletTransactions: {
                    orderBy: { fecha: 'desc' },
                    take: 5
                }
            }
        });

        users.forEach(user => {
            console.log(`\nUser: ${user.name} (${user.username}) - Role: ${user.role}`)
            const wallet = user.wallet[0];
            if (wallet) {
                console.log(`  Wallet Balance: RD$ ${wallet.saldo}`)
                wallet.accounts.forEach(acc => {
                    console.log(`    Account: ${acc.nombre} - Balance: RD$ ${acc.saldo}`)
                })
            } else {
                console.log("  No Wallet found!")
            }

            console.log("  Recent Transactions:")
            if (user.walletTransactions.length === 0) {
                console.log("    (No transactions)")
            }
            user.walletTransactions.forEach((t, i) => {
                console.log(`    ${i}: [${t.tipo}] ${t.monto} - ${t.descripcion} (${t.estado}) - Fecha: ${t.fecha}`)
            });
        });

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
