const { SlashCommandBuilder, SlashCommandSubcommandBuilder, Interaction } = require("discord.js");
const UserHandler = require("../../handlers/userHandler");
const Leaderboard = require("../../objects/leaderboard");
const Server = require("../../objects/server");

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
	nsfw: false,
	administrator: false,
	/**
	 * 
	 * @param {Interaction} interaction 
	 */
	async execute(interaction) {
		let command = interaction.options.getSubcommand();

		if(command == 'server') {
			let server = new Server(interaction.guild);
			await server.load();
			if(!server.isPremium()) return interaction.sendPremiumRequired();
		}
		let leaderboard = new Leaderboard(interaction, interaction.client);
		let card = await leaderboard.generateLeaderboard(command == 'global');

		interaction.reply({ files: [card] });

	}
}