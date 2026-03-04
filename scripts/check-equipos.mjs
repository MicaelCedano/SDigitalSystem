import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const alejandroId = 3
    const equipos = await prisma.equipo.findMany({
        where: {
            userId: alejandroId,
        }
    })
    console.log('EQUIPOS DE ALEJANDRO:', equipos.map(e => ({ id: e.id, imei: e.imei, marca: e.marca, modelo: e.modelo, estado: e.estado })))

    const distinctStatuses = await prisma.equipo.findMany({
        select: { estado: true },
        distinct: ['estado']
    })
    console.log('ESTADOS POSIBLES:', distinctStatuses.map(s => s.estado))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
