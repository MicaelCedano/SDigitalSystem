
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Checking top 5 equipos:")
    const equipos = await prisma.equipo.findMany({
        take: 5,
        include: {
            deviceModel: true,
            purchase: true
        }
    })
    console.log(JSON.stringify(equipos, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
