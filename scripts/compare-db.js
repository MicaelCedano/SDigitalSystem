const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
    const prisma = new PrismaClient();
    try {
        // 1. Get models from schema.prisma
        const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');

        // Simple regex to extract model names and their mappings
        const modelRegex = /model (\w+) \{[\s\S]+?\}\s*(?=@@map\("(\w+)"\)||$)/g;
        const models = [];
        let match;

        // Better way: find all @@map("...") in the file and their corresponding model names
        // or just find the table names from @@map and the model name if no @@map
        const fullContent = schemaContent;
        const lines = fullContent.split('\n');
        let currentModel = null;
        const expectedTables = new Set();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const modelMatch = line.match(/^model\s+(\w+)\s+\{/);
            if (modelMatch) {
                currentModel = modelMatch[1];
                // default table name is model name
                expectedTables.add(currentModel.toLowerCase());
            } else if (line.startsWith('@@map("') && currentModel) {
                const tableMatch = line.match(/@@map\("(\w+)"\)/);
                if (tableMatch) {
                    // remove the default name (model.toLowerCase) and add the explicitly mapped name
                    expectedTables.delete(currentModel.toLowerCase());
                    expectedTables.add(tableMatch[1]);
                }
                currentModel = null;
            } else if (line === '}') {
                currentModel = null;
            }
        }

        // Special case for system_setting (it doesn't have @@map but is lowercase in schema)
        // Wait, the schema I read had 'model system_setting' which matches the regex.

        console.log(`Buscando ${expectedTables.size} tablas esperadas según schema.prisma...`);

        // 2. Get tables from database
        const dbTablesRaw = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
        const dbTables = new Set(dbTablesRaw.map(t => t.table_name));

        // 3. Compare
        console.log('\n--- COMPARACIÓN DE TABLAS ---');
        const missing = [];
        for (const table of expectedTables) {
            if (!dbTables.has(table)) {
                missing.push(table);
            }
        }

        if (missing.length === 0) {
            console.log('✅ Todas las tablas requeridas por el proyecto ya existen en la base de datos.');
        } else {
            console.log('❌ Faltan las siguientes tablas en la base de datos:');
            missing.forEach(m => console.log(`- ${m}`));
            console.log('\nPara crearlas, puedes ejecutar: npx prisma db push');
        }

        const extra = [];
        for (const table of dbTables) {
            if (!expectedTables.has(table) && table !== '_prisma_migrations' && table !== '_ConversationToUser') {
                extra.push(table);
            }
        }

        if (extra.length > 0) {
            console.log('\n⚠️ Tablas EXTRA en la base de datos (no usadas en el proyecto actual):');
            extra.forEach(m => console.log(`- ${m}`));
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
