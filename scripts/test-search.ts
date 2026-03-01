
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const targetImei = "355157583366777"
    console.log(`Searching for IMEI: ${targetImei}`)
    try {
        const result = await prisma.equipo.findFirst({
            where: { imei: targetImei }
        })
        console.log("Found exactly:", result ? result.id : "NOT FOUND")

        const resultContains = await prisma.equipo.findFirst({
            where: { imei: { contains: targetImei } }
        })
        console.log("Found contains:", resultContains ? resultContains.id : "NOT FOUND")
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
