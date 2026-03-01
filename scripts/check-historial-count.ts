
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    try {
        const count: any[] = await prisma.$queryRaw`SELECT count(*) FROM equipo_historial`
        console.log("Historial Count:", count[0].count)
    } finally {
        await prisma.$disconnect()
    }
}

main()
