
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Identifying latest purchase and equipments to fix...")
    try {
        const latestPurchase = await prisma.purchase.findFirst({
            orderBy: { id: 'desc' }
        })

        if (!latestPurchase) {
            console.log("No purchases found.")
            return
        }

        console.log(`Latest Purchase ID: ${latestPurchase.id}`)

        const equipmentsToFix = await prisma.equipo.findMany({
            where: {
                purchaseId: latestPurchase.id,
                estado: 'En Inventario',
                historial: {
                    some: {
                        estado: 'Revisado'
                    }
                }
            },
            select: { id: true, imei: true, loteId: true }
        })

        console.log(`Found ${equipmentsToFix.length} equipments to fix.`)

        if (equipmentsToFix.length === 0) return

        // Perform bulk update and history creation
        const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
        const adminId = admin ? admin.id : 1

        await prisma.$transaction(async (tx) => {
            // Update status
            await tx.equipo.updateMany({
                where: { id: { in: equipmentsToFix.map(e => e.id) } },
                data: { estado: 'Revisado' }
            })

            // Create history entries
            const historyEntries = equipmentsToFix.map(eq => ({
                equipoId: eq.id,
                fecha: new Date(),
                estado: 'Revisado',
                userId: adminId,
                observacion: "Corrección manual: Movido de 'En Inventario' a 'Revisado' por solicitud.",
                loteId: eq.loteId
            }))

            await tx.equipoHistorial.createMany({
                data: historyEntries
            })
        })

        console.log("Successfully fixed equipments status.")

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
