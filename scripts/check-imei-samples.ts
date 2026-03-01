
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Checking some samples from 'equipo':")
    try {
        const samples = await prisma.equipo.findMany({
            take: 5,
            select: {
                id: true,
                imei: true,
                marca: true,
                modelo: true,
                estado: true
            }
        })
        console.log(JSON.stringify(samples, null, 2))
    } catch (e) {
        console.error("Error fetching samples:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
