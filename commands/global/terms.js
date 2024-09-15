const { SlashCommandBuilder } = require("discord.js");
const UserHandler = require("handlers/userHandler");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("terms")
		.setDescription("View the Terms of Use"),
	nsfw: false,
	administrator: false,
	async execute(interaction) {
		interaction.reply({ embeds: [new UserHandler().getTerms()] });
	}
}