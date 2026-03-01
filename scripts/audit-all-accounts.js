
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("Audit ALL accounts for all users...");
    const wallets = await prisma.wallet.findMany({
        include: { tecnico: true, accounts: true }
    });

    wallets.forEach(w => {
        console.log(`\nUser: ${w.tecnico.username} | Wallet Total Saldo: ${w.saldo}`);
        w.accounts.forEach(acc => {
            console.log(`  Acc [${acc.id}] ${acc.nombre} (${acc.tipo}): RD$ ${acc.saldo}`);
        });
    });

    await prisma.$disconnect();
}
main()
