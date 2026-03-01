
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const username = 'Alejandro'
    console.log(`Testing Penalty Application for user: ${username}`)
    try {
        const user = await prisma.user.findFirst({
            where: { username },
            include: { wallet: { include: { accounts: true } } }
        });

        const wallet = user.wallet[0];
        const principalAcc = wallet.accounts.find(a => a.nombre === 'Principal');

        console.log(`BEFORE: Wallet: ${wallet.saldo} | Principal: ${principalAcc?.saldo}`);

        await prisma.$transaction(async (tx) => {
            await tx.walletAccount.update({
                where: { id: principalAcc.id },
                data: { saldo: { decrement: 1 } }
            });
            await tx.wallet.update({
                where: { id: wallet.id },
                data: { saldo: { decrement: 1 } }
            });
        });

        const updatedUser = await prisma.user.findFirst({
            where: { username },
            include: { wallet: { include: { accounts: true } } }
        });
        const updatedWallet = updatedUser.wallet[0];
        const updatedPrincipal = updatedWallet.accounts.find(a => a.nombre === 'Principal');

        console.log(`AFTER:  Wallet: ${updatedWallet.saldo} | Principal: ${updatedPrincipal?.saldo}`);

        // Restore
        await prisma.$transaction(async (tx) => {
            await tx.walletAccount.update({ where: { id: principalAcc.id }, data: { saldo: { increment: 1 } } });
            await tx.wallet.update({ where: { id: wallet.id }, data: { saldo: { increment: 1 } } });
        });

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
