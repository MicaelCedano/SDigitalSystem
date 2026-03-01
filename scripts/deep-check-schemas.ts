
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    try {
        const schemas: any[] = await prisma.$queryRaw`
            SELECT DISTINCT table_schema 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
            ORDER BY table_schema;
        `
        console.log("Schemas found:")
        console.log(JSON.stringify(schemas, null, 2))

        for (const s of schemas) {
            const tables: any[] = await prisma.$queryRawUnsafe(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = '${s.table_schema}'
                ORDER BY table_name;
            `)
            console.log(`Tables in ${s.table_schema}:`)
            console.log(JSON.stringify(tables.map(t => t.table_name), null, 2))
        }
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
