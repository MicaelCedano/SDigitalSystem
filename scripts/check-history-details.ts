
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const id = 1
    console.log(`Deep check for Equipment ID: ${id}`)
    try {
        const equipo = await prisma.equipo.findUnique({
            where: { id },
            include: {
                historial: {
                    include: {
                        user: true
                    }
                }
            }
        })
        console.log("Found:", !!equipo)
        if (equipo) {
            console.log("IMEI:", equipo.imei)
            console.log("History Count:", equipo.historial.length)
            equipo.historial.forEach((h, i) => {
                console.log(`HEntry ${i}: ${h.estado} on ${h.fecha} by ${h.user?.username || 'unknown'}`)
            })
        }
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
