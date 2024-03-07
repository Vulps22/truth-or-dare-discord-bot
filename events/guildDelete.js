const { Events, WebhookClient } = require("discord.js")
const Database = require("../database")

module.exports = {
	name: Events.GuildDelete,
	async execute(guild) {
		const db = new Database();
		db.delete('guilds', guild.id).then( () => {
			const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_SERVER_URL});
 
			webhookClient.send(`Bot has been removed from server: ${guild.name}\n\n || ID: ${guild.id} ||`);
		})

	}
}