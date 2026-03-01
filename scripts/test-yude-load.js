
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const username = 'Yude'
    console.log(`Testing Penalty Application for user: ${username}`)
    try {
        const user = await prisma.user.findFirst({
            where: { username },
            include: { wallet: { include: { accounts: true } } }
        });

        if (!user || user.wallet.length === 0) {
            console.log("User or wallet not found");
            return;
        }

        const wallet = user.wallet[0];
        console.log("Loaded Wallet Accounts:", wallet.accounts.map(a => `${a.nombre} (id:${a.id}, saldo:${a.saldo})`));

        // Let's simulate applyPenaltyByImei's finding logic
        const walletWithPrincipal = await prisma.wallet.findFirst({
            where: { tecnicoId: user.id },
            include: { accounts: { where: { nombre: "Principal" } } }
        });

        console.log("Wallet with Principal load:", walletWithPrincipal.accounts.map(a => `${a.nombre} (id:${a.id}, saldo:${a.saldo})`));

        const principalAcc = walletWithPrincipal.accounts[0];
        if (!principalAcc) {
            console.log("BUG DETECTED: Principal account not found by name 'Principal'");
        } else {
            console.log(`Success: Found Principal (id:${principalAcc.id}) with saldo ${principalAcc.saldo}`);
        }

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
