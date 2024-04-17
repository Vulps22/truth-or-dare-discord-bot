const { SlashCommandBuilder } = require("discord.js");
const DareHandler = require("../../handlers/dareHandler");
const TruthHandler = require("../../handlers/truthHandler");

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