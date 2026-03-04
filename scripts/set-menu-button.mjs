import fetch from 'node-fetch';

const token = '8649808517:AAGggZAf8La2KTnI-xvS8ZIV5KhDO70J8zU';
const url = `https://api.telegram.org/bot${token}/setChatMenuButton`;

async function setMenuButton() {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                menu_button: {
                    type: "web_app",
                    text: "🛍️ CREAR PEDIDO",
                    web_app: { url: "https://sdigitalsystem.vercel.app/pedidos/nuevo" }
                }
            })
        });
        const data = await response.json();
        console.log('Botón de Menú configurado:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

setMenuButton();
