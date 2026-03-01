
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("--- COLUMN NAMES CHECK ---")
    try {
        const columns: any[] = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'equipo'
            ORDER BY ordinal_position;
        `
        console.log(JSON.stringify(columns, null, 2))
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
