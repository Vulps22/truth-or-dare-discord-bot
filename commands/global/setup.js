const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const UserHandler = require("../../userHandler");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Required by ALL Servers before users can use any commands'),
	async execute(interaction) {
		if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
			interaction.reply("Only an administrator can run setup commands or accept my terms")
			return;
		} else {
			new UserHandler().startSetup(interaction);
		}
	}
}