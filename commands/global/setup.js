const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const UserHandler = require("../../handlers/userHandler");
const SetupHandler = require("../../handlers/setupHandler");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Required by ALL Servers before users can use any commands'),
	nsfw: false,
	administrator: true,
	ignoreSetup: true,
	async execute(interaction) {
		new SetupHandler().startSetup(interaction);
	}
}