const { SlashCommandBuilder } = require("discord.js");
const UserHandler = require("../../handlers/userHandler");
const Leaderboard = require("../../objects/leaderboard");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('View The top 10 global players!'),
	async execute(interaction) {
        let leaderboard = new Leaderboard(interaction, interaction.client);
        let card = await leaderboard.generateLeaderboard();
        console.log("card generated");
        interaction.reply({ files: [card] });
		
	}
}