const { Client } = require('pg');

async function main() {
    const connectionString = "postgres://postgres.hstezzvohtavmeibowpv:q9Os7x9c0sPqNmnk@db.hstezzvohtavmeibowpv.supabase.co:5432/postgres";
    const client = new Client({ connectionString });

    console.log('--- CREANDO TABLAS FALTANTES EN SUPABASE (SQL DIRECTO) ---');

    try {
        await client.connect();
        console.log('Conectado a PostgreSQL...');

        // 1. Create system_setting
        console.log('Creando tabla system_setting...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS "system_setting" (
        "key" VARCHAR(50) NOT NULL PRIMARY KEY,
        "value" VARCHAR(255),
        "description" VARCHAR(255),
        "updated_at" TIMESTAMP(6)
      );
    `);

        // 2. Create conversation
        console.log('Creando tabla conversation...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS "conversation" (
        "id" SERIAL PRIMARY KEY,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "is_global" BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);

        // 3. Create message
        console.log('Creando tabla message...');
        await client.query(`
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
        await client.query(`
      CREATE TABLE IF NOT EXISTS "_ConversationToUser" (
        "A" INTEGER NOT NULL,
        "B" INTEGER NOT NULL,
        CONSTRAINT "_ConversationToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "_ConversationToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

        try {
            await client.query(`CREATE UNIQUE INDEX "_ConversationToUser_AB_unique" ON "_ConversationToUser"("A", "B");`);
            await client.query(`CREATE INDEX "_ConversationToUser_B_index" ON "_ConversationToUser"("B");`);
        } catch (e) {
            console.log('Índices ya existen o error menor ignorado.');
        }

        console.log('✅ ¡Tablas creadas exitosamente!');
    } catch (err) {
        console.error('❌ Error al crear tablas:', err.message);
    } finally {
        await client.end();
    }
}

main();
