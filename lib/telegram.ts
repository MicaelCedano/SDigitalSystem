export function escapeHTML(str: string) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export async function sendTelegramMessage(message: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.warn("[Telegram] Bot Token o Chat ID no configurados en .env");
        return;
    }

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[Telegram] Error de API:", data);
            // Si el error es por el parse_mode HTML, intentamos enviarlo como texto plano
            if (data.description?.includes("can't parse entities")) {
                console.log("[Telegram] Reintentando como texto plano...");
                await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: message.replace(/<[^>]*>?/gm, ''), // Quitar etiquetas HTML
                    }),
                });
            }
        } else {
            console.log("[Telegram] Mensaje enviado correctamente");
        }
    } catch (error) {
        console.error("[Telegram] Error crítico al enviar mensaje:", error);
    }
}
