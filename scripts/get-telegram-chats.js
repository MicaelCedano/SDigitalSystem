
async function findChatId() {
    const token = "8649808517:AAGggZAf8La2KTnI-xvS8ZIV5KhDO70J8zU";
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
findChatId();
