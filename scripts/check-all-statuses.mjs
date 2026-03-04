import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const distinctStatuses = await prisma.equipo.findMany({
        select: { estado: true },
        distinct: ['estado']
    })
    console.log('ESTADOS TOTALES EN LA BD:', distinctStatuses.map(s => s.estado))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
