const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandStringOption } = require("discord.js");
const DareHandler = require("../../dareHandler");
const TruthHandler = require("../../truthHandler");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create')
		.setDescription('Add your own Truth or Dare to the Global Pool')
		.setNSFW(true)
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('dare')
			.setDescription('Add a new Dare to the Global Pool')
			.addStringOption(new SlashCommandStringOption()
				.setName('text')
				.setDescription('What would you like your Dare to say? Remember to keep it legal and safe')
				.setRequired(true)
			)
		)
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('truth')
			.setDescription('Add a new Truth to the Global Pool')
			.addStringOption(new SlashCommandStringOption()
				.setName('text')
				.setDescription('What would you like your Truth to say? Remember to keep it legal and safe')
				.setRequired(true)
			)
		),
	async execute(interaction) {
		//handle different subcommands
		const subcommand = interaction.options.getSubcommand();

		switch (subcommand) {
			case 'dare':
				// Handle the "dare" subcommand
				new DareHandler(interaction.client).createDare(interaction);
				break;

			case 'truth':
				// Handle the "truth" subcommand
				new TruthHandler(interaction.client).createTruth(interaction);
				break;

			default:
				// Handle the case where an unknown subcommand is used
				break;
		}
	}
}