const { SlashCommandBuilder } = require("discord.js");
const DareHandler = require("handlers/dareHandler.js");


module.exports = {
	data: new SlashCommandBuilder()
		.setName('dare')
		.setDescription('Get a Dare. Remember to prove you did it ;)'),
	nsfw: true,
	administrator: false,
	async execute(interaction) {
		new DareHandler(interaction.client).getQuestion(interaction);
	}
}