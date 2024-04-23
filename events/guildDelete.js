const { Events, WebhookClient } = require("discord.js");
const Database = require("../objects/database");

module.exports = {
    name: Events.GuildDelete,
    async execute(guild) {
        const db = new Database();
        const server = await db.get('servers', guild.id);

        if (!server.isBanned) {
            await sendWebhookMessage(`Bot has been removed from banned server: ${guild.name}\n\n || ID: ${guild.id} || \\n\\n Server data preserved`);
        }

        await db.delete('servers', guild.id);
        await sendWebhookMessage(`Bot has been removed from server: ${guild.name}\n\n || ID: ${guild.id} ||`);
    }
};

async function sendWebhookMessage(message) {
    const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_SERVER_URL });
    await webhookClient.send(message);
}