const { SlashCommandBuilder } = require("discord.js");
const UserHandler = require("handlers/userHandler");
const embedder = require("embedder");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("rules")
		.setDescription("View the Rules for the /create command"),
	nsfw: false,
	administrator: false,
	async execute(interaction) {
		interaction.reply({ embeds: [embedder.rules()] });
	}
}