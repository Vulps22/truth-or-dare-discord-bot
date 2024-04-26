const { SlashCommandBuilder, PermissionsBitField, WebhookClient } = require("discord.js");
const UserHandler = require("../../handlers/userHandler");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('accept-terms')
		.setDescription('Required by ALL Servers before users can use any commands'),
	nsfw: false,
	administrator: true,
	ignoreSetup: true,
	developer: false,
	async execute(interaction) {

		new UserHandler().acceptSetup(interaction).then(() => {
			const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_SERVER_URL });

			webhookClient.send(`${interaction.guild.name} has accepted Terms and is now using the Bot!`);
		});
	}
}