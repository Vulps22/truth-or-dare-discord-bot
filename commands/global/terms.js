const { SlashCommandBuilder } = require("discord.js");
const UserHandler = require("../../userHandler");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("terms")
		.setDescription("View the Terms of Use")
		.setNSFW(true),
	async execute(interaction) {
		interaction.reply({embeds: [new UserHandler().getTerms()]});
	}
}