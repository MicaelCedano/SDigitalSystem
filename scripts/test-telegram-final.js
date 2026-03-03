
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno manualmente
dotenv.config({ path: path.join(__dirname, '../.env') });

async function sendTelegramMessage(message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    console.log("Token:", token ? "Configurado" : "Faltante");
    console.log("Chat ID:", chatId);

    if (!token || !chatId) {
        console.warn("Error: Token o ChatID no encontrados en .env");
        return;
    }

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
            }),
        });

        const data = await response.json();
        if (response.ok) {
            console.log("✅ Mensaje enviado con éxito");
        } else {
            console.error("❌ Error de Telegram:", data);
        }
    } catch (error) {
        console.error("❌ Error en la petición:", error);
    }
}

async function test() {
    await sendTelegramMessage("✅ <b>¡Conexión Exitosa!</b>\n\nEl sistema de pedidos de <b>Señal Digital</b> ya está vinculado a este grupo.\n\nRecibirán notificaciones automáticas aquí.");
}

test();
