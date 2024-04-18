const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandUserOption, SlashCommandStringOption } = require("discord.js");
const TruthHandler = require("../../handlers/truthHandler");
const DareHandler = require("../../handlers/dareHandler");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('give')
		.setDescription('Challenge another player with a Truth or Dare Question')
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('dare')
			.setDescription('Dare a user to do something')
			.addUserOption(new SlashCommandUserOption()
				.setName('user')
				.setDescription('The user to give the Dare to')
				.setRequired(true)
			)
			.addStringOption(new SlashCommandStringOption()
				.setName('dare')
				.setDescription('The Dare to give')
				.setRequired(true)
			)
		)
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('truth')
			.setDescription('Ask a user a Truth Question')
			.addUserOption(new SlashCommandUserOption()
				.setName('user')
				.setDescription('The user to ask')
				.setRequired(true)
			)
			.addStringOption(new SlashCommandStringOption()
				.setName('truth')
				.setDescription('The Truth to ask')
				.setRequired(true)
			)
		),
	async execute(interaction) { 
		const subcommand = interaction.options.getSubcommand();

		switch(subcommand) {
			case 'truth':
				new TruthHandler(interaction.client).giveTruth(interaction);
				break;
			case 'dare':
				new DareHandler(interaction.client).giveDare(interaction);
				break;
			default:
				break;
		}
	}
}