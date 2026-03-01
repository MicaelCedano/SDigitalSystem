
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("--- TABLE NAMES CHECK ---")
    try {
        const tables: any[] = await prisma.$queryRaw`
            SELECT table_name, (SELECT count(*) FROM equipo) as count_val
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `
        console.log(JSON.stringify(tables, null, 2))
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
