const { Events, WebhookClient } = require("discord.js");
const Database = require("../objects/database");

module.exports = {
    name: Events.GuildDelete,
    async execute(server) {
        const db = new Database();
        //const server = await db.get('servers', server.id);

        if (!server.isBanned) {
            await sendWebhookMessage(`Bot has been removed from banned server: ${server.name}\n\n || ID: ${server.id} || \\n\\n Server data preserved`);
        }

        await db.delete('servers', server.id);
        await sendWebhookMessage(`Bot has been removed from server: ${server.name}\n\n || ID: ${server.id} ||`);
    }
};

async function sendWebhookMessage(message) {
    const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_SERVER_URL });
    await webhookClient.send(message);
}