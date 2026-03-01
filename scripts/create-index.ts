
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Adding index to 'equipo_historial'...")
    try {
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS idx_equipo_historial_equipo_id 
            ON equipo_historial(equipo_id);
        `
        console.log("Index created successfully!")
    } catch (e) {
        console.error("Failed to create index:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
