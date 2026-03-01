
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Testing findUnique by ID: 1")
    try {
        const result = await prisma.equipo.findUnique({
            where: { id: 1 },
            include: { deviceModel: true }
        })
        console.log("Result:", result ? `Found ${result.marca} ${result.modelo}` : "NOT FOUND")
    } catch (e) {
        console.error("Error in findUnique:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
