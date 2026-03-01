const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Faltan variables de entorno para Supabase')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
    console.log('--- CONFIGURANDO STORAGE EN SUPABASE ---')

    const { data, error } = await supabase.storage.createBucket('profiles', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    })

    if (error) {
        if (error.message.includes('already exists')) {
            console.log('✅ El bucket "profiles" ya existe.')
        } else {
            console.error('❌ Error al crear bucket:', error.message)
        }
    } else {
        console.log('✅ Bucket "profiles" creado exitosamente.')
    }
}

setupStorage()
