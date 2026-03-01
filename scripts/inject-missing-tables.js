const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DIRECT_URL || process.env.DATABASE_URL
            }
        }
    });

    console.log('--- CREANDO TABLAS FALTANTES EN SUPABASE (MANUAL) ---');

    try {
        // 1. Create system_setting
        console.log('Creando tabla system_setting...');
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "system_setting" (
        "key" VARCHAR(50) NOT NULL PRIMARY KEY,
        "value" VARCHAR(255),
        "description" VARCHAR(255),
        "updated_at" TIMESTAMP(6)
      );
    `);

        // 2. Create conversation
        console.log('Creando tabla conversation...');
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "conversation" (
        "id" SERIAL PRIMARY KEY,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        "is_global" BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);

        // 3. Create message
        console.log('Creando tabla message...');
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "message" (
        "id" SERIAL PRIMARY KEY,
        "content" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "sender_id" INTEGER NOT NULL,
        "conversation_id" INTEGER NOT NULL,
        "read" BOOLEAN NOT NULL DEFAULT FALSE,
        CONSTRAINT "message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

        // 4. Create _ConversationToUser (Many-to-Many helper table)
        console.log('Creando tabla intermedia _ConversationToUser...');
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_ConversationToUser" (
        "A" INTEGER NOT NULL,
        "B" INTEGER NOT NULL,
        CONSTRAINT "_ConversationToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "_ConversationToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "_ConversationToUser_AB_unique" ON "_ConversationToUser"("A", "B");
      CREATE INDEX IF NOT EXISTS "_ConversationToUser_B_index" ON "_ConversationToUser"("B");
    `);

        console.log('✅ ¡Tablas creadas exitosamente!');
    } catch (err) {
        console.error('❌ Error al crear tablas:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
