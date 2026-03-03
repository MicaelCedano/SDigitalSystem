
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const ranking = await prisma.equipoHistorial.groupBy({
        by: ['userId'],
        where: {
            estado: 'Revisado'
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
    })

    console.log('Ranking Data:', JSON.stringify(ranking, null, 2))

    for (const item of ranking) {
        if (item.userId) {
            const user = await prisma.user.findUnique({
                where: { id: item.userId },
                select: { id: true, name: true, username: true, profileImage: true }
            })
            console.log(`User ID ${item.userId}:`, user)
        } else {
            console.log(`Null User ID has count: ${item._count.id}`)
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
