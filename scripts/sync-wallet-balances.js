
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("Deep Synchronizing Wallets and Accounts...");
    const wallets = await prisma.wallet.findMany({
        include: { tecnico: true, accounts: true }
    });

    for (const w of wallets) {
        let principalAcc = w.accounts.find(a => a.nombre === 'Principal');
        const sumAccounts = w.accounts.reduce((sum, acc) => sum + (acc.saldo || 0), 0);
        const drift = w.saldo - sumAccounts;

        if (Math.abs(drift) > 0.01) {
            console.log(`\nProcessing User: ${w.tecnico.username}`);

            if (!principalAcc) {
                console.log(`  - No "Principal" account found. Creating one with balance ${w.saldo}.`);
                await prisma.walletAccount.create({
                    data: {
                        walletId: w.id,
                        nombre: 'Principal',
                        tipo: 'corriente',
                        saldo: w.saldo,
                        color: 'blue'
                    }
                });
                console.log(`  - SUCCESS: Created and set to ${w.saldo}`);
            } else {
                console.log(`  - Drift detected: ${drift}. Adjusting "Principal" account [${principalAcc.id}].`);
                const newSaldo = principalAcc.saldo + drift;
                await prisma.walletAccount.update({
                    where: { id: principalAcc.id },
                    data: { saldo: newSaldo }
                });
                console.log(`  - SUCCESS: Adjusted Principal from ${principalAcc.saldo} to ${newSaldo}`);
            }
        }
    }

    await prisma.$disconnect();
}
main()
