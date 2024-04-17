const { SlashCommandBuilder } = require("discord.js");
const TruthHandler = require('../../handlers/truthHandler.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('truth')
		.setDescription('Get a Truth question. Remember, you **must** answer honestly!'),
	async execute(interaction) {

		new TruthHandler(interaction.client).truth(interaction);
	}
}