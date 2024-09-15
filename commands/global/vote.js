const { SlashCommandBuilder } = require("discord.js");
const embedder = require("embedder");
const Database = require("objects/database");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("vote")
		.setDescription("Get a link to the top.gg vote page"),
	nsfw: false,
	administrator: false,
	ignoreSetup: false,
	async execute(interaction) {
		interaction.reply({ embeds: [embedder.vote()] });
	}

}