import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const alejandroId = 3

    const equipos = await prisma.equipo.findMany({
        where: {
            userId: alejandroId,
            estado: 'Revisado'
        }
    })

    console.log(`Encontrados ${equipos.length} equipos para Alejandro en estado Revisado.`)

    if (equipos.length === 0) {
        console.log('No hay equipos para actualizar.')
        return
    }

    const result = await prisma.$transaction(async (tx) => {
        // Update equipments
        const updateCount = await tx.equipo.updateMany({
            where: {
                userId: alejandroId,
                estado: 'Revisado'
            },
            data: {
                estado: 'Entregado',
                userId: null
            }
        })

        // Create history entries
        for (const equipo of equipos) {
            await tx.equipoHistorial.create({
                data: {
                    equipoId: equipo.id,
                    estado: 'Entregado',
                    userId: 1, // Admin (or a generic system user)
                    fecha: new Date(),
                    observacion: 'Actualización masiva: Limpieza de equipos de Alejandro (terminados hace mucho).'
                }
            })
        }

        return updateCount
    })

    console.log(`Éxito: Se actualizaron ${result.count} equipos.`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
