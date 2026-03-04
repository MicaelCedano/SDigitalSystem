import fetch from 'node-fetch';

const token = '8649808517:AAGggZAf8La2KTnI-xvS8ZIV5KhDO70J8zU';
const chatId = '-1003897679599';
const url = `https://api.telegram.org/bot${token}/sendMessage`;

const menuKeyboard = {
    keyboard: [
        [
            {
                text: "📝 PONGA LA ORDEN",
                web_app: { url: "https://sdigitalsystem.vercel.app/pedidos/nuevo" }
            }
        ],
        [{ text: "/ayuda" }]
    ],
    resize_keyboard: true
};

async function sendMenu() {
    const msg = "🎮 <b>Menú de Acceso Rápido</b>\n\nHe activado los botones de comando en la parte inferior para que sea más fácil gestionar los pedidos desde el grupo.";

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: msg,
                parse_mode: 'HTML',
                reply_markup: menuKeyboard
            })
        });
        const data = await response.json();
        console.log('Resultado:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

sendMenu();
