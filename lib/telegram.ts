export function escapeHTML(str: string) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export async function sendTelegramMessage(message: string, buttons?: any) {
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

    if (!token || !chatId) {
        console.warn("[Telegram] Bot Token o Chat ID no configurados");
        return { success: false, error: "Credenciales no configuradas" };
    }

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const body: any = {
            chat_id: isNaN(Number(chatId)) ? chatId : Number(chatId),
            text: message || "",
            parse_mode: 'HTML',
        };

        if (buttons) {
            body.reply_markup = {
                inline_keyboard: buttons
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[Telegram] Error de API:", data);

            // Reintento sin HTML si falló por parseo
            if (data.description?.includes("can't parse entities")) {
                const plainText = (message || "").replace(/<[^>]*>?/gm, '');
                const retryResponse = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: plainText,
                    }),
                });
                const retryData = await retryResponse.json();
                return { success: retryResponse.ok, data: retryData };
            }
            return { success: false, error: data.description, data };
        }

        console.log("[Telegram] Mensaje enviado correctamente");
        return { success: true, data };
    } catch (error: any) {
        console.error("[Telegram] Error crítico:", error);
        return { success: false, error: error.message };
    }
}

export async function editTelegramMessage(messageId: number, message: string, buttons?: any) {
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

    if (!token || !chatId) return { success: false };

    try {
        const url = `https://api.telegram.org/bot${token}/editMessageText`;
        const body: any = {
            chat_id: isNaN(Number(chatId)) ? chatId : Number(chatId),
            message_id: messageId,
            text: message,
            parse_mode: 'HTML',
        };

        if (buttons) {
            body.reply_markup = { inline_keyboard: buttons };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        return { success: response.ok, data: await response.json() };
    } catch (error) {
        return { success: false, error };
    }
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!token) return { success: false };

    try {
        const url = `https://api.telegram.org/bot${token}/answerCallbackQuery`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text,
            }),
        });
        return { success: response.ok };
    } catch (error) {
        return { success: false };
    }
}
