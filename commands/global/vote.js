const { Events, SlashCommandBuilder } = require("discord.js");
const embedder = require("../../embedder");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('vote')
		.setDescription('If you like the bot, Voting is the best way to help!')
		.setNSFW(true),
	async execute(interaction) {
		interaction.reply({ embeds: [embedder.vote()] });
	}
}