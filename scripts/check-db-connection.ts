
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("--- Checking Database Connection & Tables ---")
    try {
        // Get all tables from the public schema
        const tables: any[] = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `
        console.log("Tables found in database:")
        tables.forEach(t => console.log(` - ${t.table_name}`))

        console.log("\n--- Checking 'equipo' count ---")
        const equipoCount = await prisma.$queryRaw`SELECT COUNT(*) FROM equipo`
        console.log("Count in 'equipo':", equipoCount)

        console.log("\n--- Checking 'equipo_historial' count ---")
        const historialCount = await prisma.$queryRaw`SELECT COUNT(*) FROM equipo_historial`
        console.log("Count in 'equipo_historial':", historialCount)

    } catch (error) {
        console.error("Database check failed:", error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
