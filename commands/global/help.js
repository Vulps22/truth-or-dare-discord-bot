const { SlashCommandBuilder } = require("discord.js");
const embedder = require("../../embedder");
const Database = require("../../objects/database");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Show a list of commands and helpful information"),
	async execute(interaction) {
		db = new Database();
		const isSetup = db.get('servers', interaction.guildId)
		interaction.reply({ embeds: [embedder.help(isSetup ? false : true)] });
	}

}