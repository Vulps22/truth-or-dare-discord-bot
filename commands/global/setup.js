const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const UserHandler = require("../../handlers/userHandler");
const { ignoreSetup } = require("./accept-terms");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Required by ALL Servers before users can use any commands'),
	nsfw: false,
	administrator: true,
	ignoreSetup: true,
	async execute(interaction) {
		new UserHandler().startSetup(interaction);
	}
}