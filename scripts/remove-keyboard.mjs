import fetch from 'node-fetch';

const token = '8649808517:AAGggZAf8La2KTnI-xvS8ZIV5KhDO70J8zU';
const chatId = '-1003897679599';
const url = `https://api.telegram.org/bot${token}/sendMessage`;

async function removeKeyboard() {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: "✨ Limpiando interfaz... Ahora puedes chatear con normalidad.",
                reply_markup: { remove_keyboard: true }
            })
        });
        const data = await response.json();
        console.log('Teclado removido:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

removeKeyboard();
