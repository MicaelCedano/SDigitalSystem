import fetch from 'node-fetch';

const token = '8649808517:AAGggZAf8La2KTnI-xvS8ZIV5KhDO70J8zU';
const chatId = '-1003897679599';
const url = `https://api.telegram.org/bot${token}/sendMessage`;

const inlineButtons = [
    [
        {
            text: "📝 Ponga la orden",
            url: "https://sdigitalsystem.vercel.app/pedidos/nuevo"
        }
    ],
    [
        { text: "ℹ️ All-in-one (Basic Info) [IMEI/SN]", callback_data: "info_imei" }
    ],
    [
        { text: "🛠️ Android Multi Tool - 3 Month Activation", callback_data: "tool_android" }
    ],
    [
        { text: "🎨 Adobe Creative Cloud All Apps - Enterprise (1 Year)", callback_data: "adobe" }
    ],
    [
        { text: "🔑 Now password id iCloud Tecno infinix Itel", callback_data: "icloud" }
    ]
];

async function sendMenu() {
    const msg = "<b>Ponga la orden</b>\n\nRealice un pedido rápidamente haciendo clic en el botón a continuación.";

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: msg,
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: inlineButtons }
            })
        });
        const data = await response.json();
        console.log('Resultado:', data);

        if (data.ok) {
            // Pin the message
            const pinUrl = `https://api.telegram.org/bot${token}/pinChatMessage`;
            await fetch(pinUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: data.result.message_id,
                    disable_notification: true
                })
            });
            console.log('Mensaje fijado en el grupo.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

sendMenu();
