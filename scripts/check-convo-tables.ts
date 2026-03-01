
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Checking tables related to conversations:")
    try {
        const tables: any[] = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name ILIKE '%conversation%' OR table_name ILIKE '%user%' OR table_name ILIKE '%participant%'
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
