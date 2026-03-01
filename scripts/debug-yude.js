
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findFirst({
        where: { username: 'Yude' },
        include: { wallet: { include: { accounts: true } } }
    });
    console.log(user.wallet[0].accounts);
    await prisma.$disconnect();
}
main()
