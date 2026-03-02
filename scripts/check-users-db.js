const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    const users = await prisma.user.findMany({
        select: { id: true, username: true, name: true, profileImage: true }
    });
    console.log(JSON.stringify(users, null, 2));
    await prisma.$disconnect();
}

checkUsers();
