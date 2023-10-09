const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandNumberOption, SlashCommandStringOption } = require("discord.js");
const Database = require("../../database");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Ban a Dare|Truth|Guild')
		.setNSFW(true)
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('dare')
			.setDescription('Ban the specified Dare')
			.addNumberOption(new SlashCommandNumberOption()
				.setName('id')
				.setDescription('The ID of the Dare to ban')
			)
		)
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('truth')
			.setDescription('Ban the specified Truth')
			.addNumberOption(new SlashCommandNumberOption()
				.setName('id')
				.setDescription('The ID of the Truth to ban')
			)
		)
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('guild')
			.setDescription('Ban the specified Guild')
			.addStringOption(new SlashCommandStringOption()
				.setName('id')
				.setDescription('The ID of the Guild to ban')
			)
		),
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		switch (subcommand) {
			case 'dare':
				banDare(interaction.options.getNumber('id'), interaction);
				break;
			case 'truth':
				banTruth(interaction.options.getNumber('id'), interaction);
				break;
			case 'guild':
				banGuild(interaction.options.getString('id'), interaction);
				break;
			default:
				interaction.reply('Not an Option');
				break;
		}
	}
}

function banDare(id, interaction) {
	const db = new Database();
	db.get('dares', id).then(dare => {
		if (!dare) {
			console.log("Attempted to ban unknown dare with ID: ", id)
			interaction.reply('Dare not found!');
			return;
		}

		dare.isBanned = 1;
		db.set('dares', dare);
		interaction.reply('Dare has been banned!')
	});
}

function banTruth(id, interaction) {
	const db = new Database();
	let truth = db.get('truths', id).then(truth => {
		if (!truth) {
			interaction.reply('Truth not found!');
			return;
		}

		truth.isBanned = 1;
		db.set('truths', truth);
		interaction.reply('Truth has been banned!')
	});
}

function banGuild(id, interaction) {
	const db = new Database();
	let guild = db.get('guilds', id).then(guild => {
	if (!guild) {
		interaction.reply('Guild not found!');
		return;
	}
	guild.id = id;
	guild.isBanned = 1;
	db.set('guilds', guild);
	interaction.reply('Guild has been banned!')
});
}