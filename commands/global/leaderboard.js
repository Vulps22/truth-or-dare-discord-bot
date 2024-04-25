const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require("discord.js");
const UserHandler = require("../../handlers/userHandler");
const Leaderboard = require("../../objects/leaderboard");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('View The top 10 global players!')
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('global')
			.setDescription('View the top 10 global players!')
		)
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('server')
			.setDescription('View the top 10 server players!')
		),
	async execute(interaction) {
		let command = interaction.options.getSubcommand();
		console.log("command: " + command);
		let leaderboard = new Leaderboard(interaction, interaction.client);
		let card = await leaderboard.generateLeaderboard(command == 'global');
		console.log("card generated");
		interaction.reply({ files: [card] });

	}
}