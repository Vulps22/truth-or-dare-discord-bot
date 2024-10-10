const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandStringOption, Interaction, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const DareHandler = require("handlers/dareHandler");
const TruthHandler = require("handlers/truthHandler");
const Database = require("objects/database");
const logger = require("objects/logger");
const User = require("objects/user");
const embedder = require("embedder");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create')
		.setDescription('Add your own Truth or Dare to the Global Pool')
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
	nsfw: true,
	administrator: false,
	/**
	 * 
	 * @param {Interaction} interaction 
	 * @returns 
	 */
	async execute(interaction) {
		if(!interaction.deferred) await interaction.deferReply({ ephemeral: true });
		const user = new User(interaction.user.id);
		await user.get();
		if (!await user.canCreate()) {
			const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('rules_accept')
						.setLabel('Accept Rules')
						.setStyle(ButtonStyle.Success),
				);
			interaction.editReply({ content: "You must accept the rules before creating a Truth or Dare", embeds: [embedder.rules()], components: [row], ephemeral: true });
			logger.editLog(interaction.logMessage.id, `${interaction.logInteraction} Aborted: User has not accepted the rules`);
			return;
		}

		//handle different subcommands
		const subcommand = interaction.options.getSubcommand();


		switch (subcommand) {
			case 'dare':
				if(!await canCreate(interaction)) return;
				// Handle the "dare" subcommand
				new DareHandler(interaction.client).createDare(interaction);
				break;

			case 'truth':
				if(!await canCreate(interaction)) return;
				// Handle the "truth" subcommand
				new TruthHandler(interaction.client).createTruth(interaction);
				break;

			default:
				logger.error(`Aborted creation: Invalid type specified`);
				break;
		}
	}
}

async function canCreate(interaction) {
	const db = new Database();
	lastQuestion = await db.createdWithin('questions', 2, interaction.user.id);

	if (lastQuestion.length > 0 && my.environment !== 'dev') {
		interaction.editReply({ content: `Aborted creation: User attempted to create a Truth or Dare within 2 minutes`, ephemeral: true });
		logger.error(`Aborted creation: User attempted to create a Truth or Dare within 2 minutes`);

		return;
	}

	return true;
}