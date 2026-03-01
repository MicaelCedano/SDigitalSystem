
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Checking plural table names 'equipos' vs 'equipo':")
    try {
        const equipoCount: any[] = await prisma.$queryRaw`SELECT count(*) FROM equipo`
        console.log("Count in 'equipo':", equipoCount[0].count)
    } catch (e) {
        console.log("No table 'equipo'")
    }

    try {
        const equiposCount: any[] = await prisma.$queryRaw`SELECT count(*) FROM equipos`
        console.log("Count in 'equipos':", equiposCount[0].count)
    } catch (e) {
        console.log("No table 'equipos'")
    }
}

main().finally(() => prisma.$disconnect())
