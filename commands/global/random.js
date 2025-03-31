const { SlashCommandBuilder } = require("discord.js");
const Handler = require("handlers/handler");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('random')
		.setDescription('Get a random Truth or Dare, let the bot decide!'),
	nsfw: true,
	administrator: false,
	async execute(interaction) {
		const random = Math.floor(Math.random() * 2);
		let type = 'truth';
		if (random == 1) type = 'dare';
		new Handler(type).getQuestion(interaction);
	}
}