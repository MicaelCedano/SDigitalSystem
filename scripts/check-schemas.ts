
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Checking schemas and equipment tables in other schemas:")
    try {
        const schemas: any[] = await prisma.$queryRaw`
            SELECT schema_name 
            FROM information_schema.schemata;
        `
        console.log("Schemas:", schemas.map(s => s.schema_name))

        const allEquipos: any[] = await prisma.$queryRaw`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name ILIKE '%equipo%'
        `
        console.log("Tables with 'equipo' in name:")
        console.log(JSON.stringify(allEquipos, null, 2))
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
