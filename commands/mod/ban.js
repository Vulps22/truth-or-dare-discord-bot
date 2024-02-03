const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandNumberOption, SlashCommandStringOption, PermissionsBitField, EmbedBuilder } = require("discord.js");
const Database = require("../../database");
const Question = require("../../question");
const { env } = require("process");

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
			.addStringOption(new SlashCommandStringOption()
				.setName('reason')
				.setDescription('Why are you banning this?')
			)
		)
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('truth')
			.setDescription('Ban the specified Truth')
			.addNumberOption(new SlashCommandNumberOption()
				.setName('id')
				.setDescription('The ID of the Truth to ban')
			)
			.addStringOption(new SlashCommandStringOption()
				.setName('reason')
				.setDescription('Why are you banning this?')
			)
		)
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('guild')
			.setDescription('Ban the specified Guild')
			.addStringOption(new SlashCommandStringOption()
				.setName('id')
				.setDescription('The ID of the Guild to ban')
			)
			.addStringOption(new SlashCommandStringOption()
				.setName('reason')
				.setDescription('Why are you banning this?')
			)
		),
	async execute(interaction) {
		if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
			interaction.reply('You do not have permission to run this command');
			return;
		}
		const subcommand = interaction.options.getSubcommand();

		switch (subcommand) {
			case 'dare':
				banDare(interaction.options.getNumber('id'), interaction.options.getString('reason'), interaction);
				break;
			case 'truth':
				banTruth(interaction.options.getNumber('id'), interaction.options.getString('reason'), interaction);
				break;
			case 'guild':
				banGuild(interaction.options.getString('id'), interaction.options.getString('reason'), interaction);
				break;
			default:
				interaction.reply('Not an Option');
				break;
		}
	}
}

function banDare(id, reason, interaction) {
	const db = new Database();
	db.get('dares', id).then(dare => {
		if (!dare) {
			console.log("Attempted to ban unknown dare with ID: ", id)
			interaction.reply('Dare not found!');
			return;
		}
		sendBanNotification(dare, reason, 'dare', interaction);
		dare.isBanned = 1;
		dare.banReason = reason;
		db.set('dares', dare);
		interaction.reply(`Dare has been banned!\n- **ID**: ${dare.id}\n- **Question**: ${dare.question}\n- **Reason**: ${reason}`)
	});
}

function banTruth(id,reason, interaction) {
	const db = new Database();
	db.get('truths', id).then(truth => {
		if (!truth) {
			interaction.reply("Attempted to ban unknown truth with ID: ", id);
			return;
		}
		sendBanNotification(truth, reason, 'truth', interaction);
		truth.isBanned = 1;
		truth.banReason = reason;
		db.set('truths', truth);
		interaction.reply(`Truth has been banned!\n- **ID**: ${truth.id}\n- **Question**: ${truth.question}\n- **Reason**: ${reason}`)
	});
}

function banGuild(id, reason, interaction) {
	const db = new Database();
	let guild = db.get('guilds', id).then(guild => {
		if (!guild) {
			interaction.reply('Guild not found!');
			return;
		}

		sendGuildBanNotification(guild, reason, interaction);
		// guild.isBanned = 1;
		guild.banReason = reason;
		db.set('guilds', guild);
		interaction.reply(`gUILD has been banned!\n- **ID**: ${guild.id}\n- **Question**: ${guild.name}\n- **Reason**: ${reason}`)
	});
}

/**
 * 
 * @param {Question} question 
 * @param {*} interaction 
 */

async function sendBanNotification(question, reason, type, interaction) {
	const userId = question.creator;
	client = interaction.client;
	try {

		let embed = guidanceEmbed();

		client.users.send(userId, {
			content: `Your ${type} has been banned: \n- **ID**: ${question.id}\n- **Question**: ${question.question}\n- **Reason**: ${reason}\n\nIf you feel this was in error you may appeal the ban by opening a ticket on our [Official Server](https://discord.gg/${env.DISCORD_INVITE_CODE})\n\n`,
			embeds: [embed]
		});
	} catch (error) {
		interaction.channel.send('Failed to notify User of ban. Check Logs for more information');
		console.log('User Notification Failed: ')
		console.log(error);
	}
}

async function sendGuildBanNotification(guild, reason, interaction) {
	client = interaction.client;
	try {

		const server = client.guilds.cache.get(guild.id);
		const userId = server.ownerId;

		client.users.send(userId, {
			content: `Your Server has been banned: \n- **ID**: ${guild.id}\n- **Question**: ${guild.name}\n- **Reason**: ${reason}\n\nIf you feel this was in error you may appeal the ban by opening a ticket on our [Official Server](https://discord.gg/${env.DISCORD_INVITE_CODE})\n\n`
		});
	} catch (error) {
		interaction.channel.send('Failed to notify User of ban. Check Logs for more information');
		console.log('User Notification Failed: ')
		console.log(error);
	}
}

function guidanceEmbed() {

	const embed = new EmbedBuilder()
		.setTitle('Avoiding Bans')
		.setDescription('Here are some tips to avoid your truths/dares being banned:')
		.addFields(
			{ name: 'No dangerous or illegal content', value: '- Keep it safe and legal' },
			{ name: 'No targeting specific people', value: '- Truths/dares are global and should work for everyone' },
			{ name: 'No mentions of "the giver"', value: '- Use /give for those types of dares' },
			{ name: 'Follow Discord guidelines', value: '- No Racism, Underage references etc.' },
			{ name: 'Use English', value: '- For bot language support' },
			{ name: 'No nonsense content', value: '- Avoid keyboard smashing, single letters etc' },
			{ name: 'No shoutouts', value: '- Using names, "I am awesome!"' },
			{ name: 'No dares that require more than one person', value: '- This is an **online** bot!' },
			{ name: 'Check spelling and grammar', value: '- Low-Effort content will not be accepted' },
			{name: '\n', value: '\n'},
			{name: 'Important Note', value: '**You could be banned from using the bot** if we have to repeatedly ban your dares!'}
		);

	return embed;

}
