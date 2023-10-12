const { SlashCommandBuilder } = require("discord.js");
const DareHandler = require("../../dareHandler");
const TruthHandler = require("../../truthHandler");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('random')
		.setDescription('Get a random Truth or Dare, let the bot decide!'),
	async execute(interaction) {
		const random = Math.floor(Math.random() * 2);
		if (random == 1) new DareHandler(interaction.client).dare(interaction);
		else new TruthHandler(interaction.client).truth(interaction);
	}
}