const { SlashCommandBuilder, SlashCommandSubcommandBuilder, Interaction } = require("discord.js");
const UserHandler = require("handlers/userHandler");
const Leaderboard = require("objects/leaderboard");
const Server = require("objects/server");
const logger = require("objects/logger");

const EXECUTION_TIME_THRESHOLD = 5000; // 5 seconds in milliseconds

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
		if (!interaction.deferred) await interaction.deferReply();
		const startTime = Date.now();
		try {
			let command = interaction.options.getSubcommand();

			if (command == 'server') {
				let server = await new Server(interaction.guildId).load();
				if (!server) {
					logger.error("Server was undefined while handling premium checks");
					return;
				}
				const premium = await server.hasPremium();
				if (!premium) {
					interaction.editReply({ content: "This is a premium command. Premium is not quite ready yet, But I'm working hard to make these commands available for everyone :)", ephemeral: true });

					//interaction.sendPremiumRequired();
					return;
				}
			}

			let leaderboard = new Leaderboard(interaction, interaction.client);
			let card = await leaderboard.generateLeaderboard(command == 'global');
			interaction.editReply({ files: [card] });

			// Calculate execution time after reply is sent
			const executionTime = Date.now() - startTime;
			console.log(`Leaderboard generation took ${executionTime}ms for ${command} command`);

			// Log warning if execution time exceeds threshold
			if (executionTime > EXECUTION_TIME_THRESHOLD) {
				logger.error(`Leaderboard generation exceeded ${EXECUTION_TIME_THRESHOLD}ms threshold!
					Command: ${command}
					Time taken: ${executionTime}ms
					Server: ${interaction.guildId}
					User: ${interaction.user.id}`);
			}

		} catch (error) {
			const executionTime = Date.now() - startTime;
			logger.error(`Leaderboard command failed after ${executionTime}ms:
				Error: ${error}
				Command: ${interaction.options.getSubcommand()}
				Server: ${interaction.guildId}
				User: ${interaction.user.id}`);
			
			// Try to notify user if we haven't already
			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply({ 
					content: 'An error occurred while generating the leaderboard.', 
					ephemeral: true 
				});
			} else if (!interaction.replied) {
				await interaction.editReply({ 
					content: 'An error occurred while generating the leaderboard.' 
				});
			}
		}
	}
}