
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Checking indices for 'equipo_historial':")
    try {
        const indices: any[] = await prisma.$queryRaw`
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'equipo_historial'
        `
        console.log(JSON.stringify(indices, null, 2))
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
