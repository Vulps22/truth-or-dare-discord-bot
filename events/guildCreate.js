const { Events, WebhookClient } = require("discord.js")
const Database = require("../objects/database");

module.exports = {
	name: Events.GuildCreate,
	async execute(server) {
		const db = new Database();
		db.set('servers', {id: server.id}).then(() => {
			const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_SERVER_URL });

			webhookClient.send(`Bot has been added to server: ${server.name}\n\n || ID: ${server.id} ||`);
		})

	}
}