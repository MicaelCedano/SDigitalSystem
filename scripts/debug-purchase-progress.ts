
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const purchaseId = 61
    console.log(`Checking Purchase #${purchaseId}`)
    try {
        const purchase = await prisma.purchase.findUnique({
            where: { id: purchaseId },
            select: { totalQuantity: true }
        })
        console.log("Purchase Total Quantity (db):", purchase?.totalQuantity)

        const items = await prisma.equipo.findMany({
            where: { purchaseId }
        })

        console.log("Total Equips in table for this purchase:", items.length)

        const states = items.reduce((acc: any, eq) => {
            acc[eq.estado] = (acc[eq.estado] || 0) + 1;
            return acc;
        }, {});
        console.log("States distribution:", states);

        const funcs = items.reduce((acc: any, eq) => {
            const f = eq.funcionalidad || 'null';
            acc[f] = (acc[f] || 0) + 1;
            return acc;
        }, {});
        console.log("Funcionalidad distribution:", funcs);

        const countRevisado = items.filter(e => ['Revisado', 'Entregado', 'Vendido'].includes(e.estado)).length
        const countFuncionalidad = items.filter(e => e.funcionalidad !== null).length
        const countEnInventarioWithFunc = items.filter(e => e.estado === 'En Inventario' && e.funcionalidad !== null).length

        console.log("Count with estado in ['Revisado', 'Entregado', 'Vendido']:", countRevisado)
        console.log("Count with funcionalidad != null:", countFuncionalidad)
        console.log("Count with estado='En Inventario' AND funcionalidad!=null:", countEnInventarioWithFunc)

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
