const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandStringOption, WebhookClient } = require("discord.js");
const DareHandler = require("../../handlers/dareHandler");
const TruthHandler = require("../../handlers/truthHandler");
const Database = require("../../objects/database");
const { administrator } = require("./xp");

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
	async execute(interaction) {
		//handle different subcommands
		const subcommand = interaction.options.getSubcommand();
		const db = new Database();
		lastDare = await db.createdWithin('dares', 2, interaction.user.id);
		lastTruth = await db.createdWithin('truths', 2, interaction.user.id);
		if (lastDare.length > 0 || lastTruth.length > 0) {
			interaction.reply({ content: `Aborted creation: User attempted to create a Truth or Dare within 2 minutes`, ephemeral: true });
			const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_COMMAND_URL });
			webhookClient.send(`Aborted creation: User attempted to create a Truth or Dare within 2 minutes`);

			return;
		}

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
				const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_COMMAND_URL });
				webhookClient.send(`Aborted creation: Invalid type specified`);
				break;
		}
	}
}