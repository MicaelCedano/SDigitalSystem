const token = '8649808517:AAGggZAf8La2KTnI-xvS8ZIV5KhDO70J8zU';
const url = `https://api.telegram.org/bot${token}/setMyCommands`;

const commands = [
    { command: 'pedido', description: 'Crear pedido (Cliente | Detalle)' },
    { command: 'ayuda', description: 'Ver comandos disponibles' }
];

async function setCommands() {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commands })
        });
        const data = await response.json();
        console.log('Resultado setMyCommands:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

setCommands();
