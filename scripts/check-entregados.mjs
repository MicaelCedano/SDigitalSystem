import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const entregados = await prisma.equipo.findMany({
        where: { estado: 'Entregado' },
        take: 5
    })
    console.log('EJEMPLO DE ENTREGADOS:', entregados.map(e => ({ imei: e.imei, userId: e.userId })))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
