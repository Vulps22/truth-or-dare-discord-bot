const { SlashCommandBuilder, PermissionsBitField, WebhookClient } = require("discord.js");
const UserHandler = require("../../handlers/userHandler");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('accept-terms')
		.setDescription('Required by ALL Servers before users can use any commands'),
	async execute(interaction) {
		if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
			interaction.reply("Only an administrator can run setup commands or accept my terms")
			return;
		} else {
			new UserHandler().acceptSetup(interaction).then(() => {
				const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_SERVER_URL});

			webhookClient.send(`${interaction.guild.name} has accepted Terms and is now using the Bot!`);
			});
		}
	}
}