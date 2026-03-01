
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    try {
        const result: any[] = await prisma.$queryRaw`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name ILIKE '%conversation%' OR table_name ILIKE '%participant%' OR table_name ILIKE '%user_conv%'
            ORDER BY table_schema, table_name;
        `
        console.log("Found tables in ALL schemas (JSON):")
        console.log(JSON.stringify(result, null, 2))
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
