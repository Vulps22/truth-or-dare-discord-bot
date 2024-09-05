const { SlashCommandBuilder, SlashCommandSubcommandBuilder, Interaction } = require("discord.js");
const UserHandler = require("../../handlers/userHandler");
const Leaderboard = require("../../objects/leaderboard");
const Server = require("../../objects/server");
const logger = require("../../objects/logger");

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
		try {
			let command = interaction.options.getSubcommand();

			if (command == 'server') {
				let server = await new Server(interaction.guildId).load();
				if (!server) {
					logger.error("Server was undefined while handling premium checks");
				}
				const premium = await server.hasPremium();

				if (!premium) {
					interaction.reply({ content: "This is a premium command. Premium is not quite ready yet, But I'm working hard to make these commands available for everyone :)", ephemeral: true });

					//interaction.sendPremiumRequired();
					return;
				}
			}

			interaction.deferReply();

			let leaderboard = new Leaderboard(interaction, interaction.client);
			let card = await leaderboard.generateLeaderboard(command == 'global');

			interaction.editReply({ files: [card] });

		} catch (error) {

		}
	}
}