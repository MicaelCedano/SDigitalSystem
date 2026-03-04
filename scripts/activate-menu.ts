import { sendTelegramMessage } from './lib/telegram.ts';

const menuKeyboard = {
    keyboard: [
        [{ text: "/pedido Cliente | Detalle" }],
        [{ text: "/ayuda" }]
    ],
    resize_keyboard: true,
    persistent: true // Only works on some clients but good to have
};

async function sendMenu() {
    const msg = "🎮 <b>Panel de Control Activado</b>\n\nHe activado el menú de botones en la parte inferior para que sea más fácil crear pedidos.";
    await sendTelegramMessage(msg, menuKeyboard);
}

sendMenu();
