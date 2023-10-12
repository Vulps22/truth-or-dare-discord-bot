const { SlashCommandBuilder } = require("discord.js");
const embedder = require("../../embedder");
const Database = require("../../database");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Show a list of commands and helpful information")
		.setNSFW(true),
	async execute(interaction) {
		db = new Database();
		const isSetup = db.get('guilds', interaction.guildId)
		interaction.reply({ embeds: [ embedder.help(isSetup ? false : true) ] });
	}

}