
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const nullUserRecords = await prisma.equipoHistorial.findFirst({
        where: { userId: null },
        orderBy: { fecha: 'desc' }
    })

    console.log('Sample Null User Record:', nullUserRecords)

    const count = await prisma.equipoHistorial.count({
        where: { userId: null }
    })
    console.log('Total Null User Records:', count)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
