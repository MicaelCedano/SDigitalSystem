const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();
    try {
        const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
        console.log('Tablas en la base de datos actual:');
        tables.forEach(t => console.log(`- ${t.table_name}`));
    } catch (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
