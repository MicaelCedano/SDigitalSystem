
import { sendTelegramMessage } from "../lib/telegram.js";

async function test() {
    console.log("Enviando mensaje de prueba...");
    await sendTelegramMessage("✅ <b>¡Conexión Exitosa!</b>\n\nEl sistema de pedidos de <b>Señal Digital</b> ya está vinculado a este grupo.\n\nRecibirán notificaciones automáticas aquí.");
    console.log("Proceso terminado.");
}

test();
