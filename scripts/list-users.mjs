import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany()
    console.log('USERS:', users.map(u => ({ id: u.id, username: u.username, name: u.name })))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
