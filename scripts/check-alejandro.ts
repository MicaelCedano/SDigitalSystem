import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { username: { contains: 'alejandro', mode: 'insensitive' } },
                { name: { contains: 'alejandro', mode: 'insensitive' } }
            ]
        }
    })
    console.log('--- ALEJANDRO USERS ---')
    console.log(JSON.stringify(users, null, 2))

    if (users.length > 0) {
        const equipos = await (prisma as any).equipo.findMany({
            where: {
                userId: users[0].id,
                estado: { not: 'ENTREGADO' }
            }
        })
        console.log('--- EQUIPOS PENDIENTES ---')
        console.log(JSON.stringify(equipos, null, 2))
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
