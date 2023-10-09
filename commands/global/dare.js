const { SlashCommandBuilder } = require("discord.js");
const DareHandler = require("../../dareHandler.js");


module.exports = {
	data: new SlashCommandBuilder()
	.setName('dare')
	.setDescription('Get a Dare. Remember to prove you did it ;)')
	.setNSFW(true),
	async execute(interaction) {
		
		new DareHandler(interaction.client).dare(interaction);
	}
}