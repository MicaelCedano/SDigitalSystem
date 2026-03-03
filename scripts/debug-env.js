
require('dotenv').config();
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

console.log("Valores leídos del .env:");
console.log("Token:", token ? "Existente (comienza con " + token.substring(0, 4) + ")" : "FALTANTE");
console.log("Chat ID:", chatId ? chatId : "FALTANTE");

if (token && chatId) {
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: "🔍 <b>Prueba de lectura de .env</b>\n\nSi lees esto, las variables de entorno están cargadas correctamente.",
            parse_mode: 'HTML'
        })
    })
        .then(r => r.json())
        .then(data => console.log("Resultado de API:", data))
        .catch(e => console.error("Error:", e));
}
