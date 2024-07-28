const { SlashCommandBuilder } = require("discord.js");
const embedder = require("../../embedder");
const Database = require("../../objects/database");
const Server = require("../../objects/server");


module.exports = {
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Show a list of commands and helpful information"),
	nsfw: false,
	administrator: false,
	ignoreSetup: true,
	/**
	 * 
	 * @param {import("discord.js").Interaction} interaction 
	 */
	async execute(interaction) {
		db = new Database();
		const server = new Server(interaction.guildId);
		await server.load();

		isSetup = server.hasAccepted;

		console.log("isSetup", isSetup);
	
		interaction.reply({ embeds: [embedder.help(isSetup)] });
	}

}