const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
    console.log('--- TEST DE CONEXIÓN FINAL A SUPABASE (via PRISMA) ---');
    try {
        const userCount = await prisma.user.count();
        console.log(`✅ Conexión exitosa. Se encontraron ${userCount} usuarios en la base de datos de Supabase.`);

        if (userCount > 0) {
            const firstUser = await prisma.user.findFirst();
            console.log(`👤 Primer usuario encontrado: ${firstUser.username} (${firstUser.role})`);
        } else {
            console.log('⚠️ La base de datos está vacía, pero la conexión es correcta.');
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
