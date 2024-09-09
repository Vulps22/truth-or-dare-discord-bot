const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandNumberOption, SlashCommandStringOption, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message } = require("discord.js");
const Database = require("../../objects/database")
const { env } = require("process");
const Dare = require("../../objects/dare");
const BanHandler = require("../../handlers/banHandler");

banReasonList = [
	{ name: "1 - Breaches Discord T&C or Community Guidelines", value: "Breaches Discord T&C or Community Guidelines" },
	{ name: "2 - Childish Content", value: "Childish Content" },
	{ name: "3 - Dangerous Or Illegal Content", value: "Dangerous Or Illegal Content" },
	{ name: "4 - Giver Dare", value: "Giver Dare" },
	{ name: "5 - Mentions A Specific Person", value: "Mentions A Specific Person" },
	{ name: "6 - Nonsense Content", value: "Nonsense Content" },
	{ name: "7 - Not In English", value: "Not In English" },
	{ name: "8 - Poor Spelling Or Grammar", value: "Poor Spelling Or Grammar - Feel Free to Resubmit with proper Spelling and Grammer" },
	{ name: "9 - Requires More Than One Person", value: "Requires More Than One Person" },
	{ name: "10 - Shoutout Content", value: "Shoutout Content" },
	{ name: "11 - Suspected U-18 Server", value: "Suspected U-18 Server" }
]


module.exports = {
	banReasons: banReasonList,
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Ban a Dare|Truth|Server')
		.setNSFW(true)
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('dare')
			.setDescription('Ban the specified Dare')
			.addNumberOption(new SlashCommandNumberOption()
				.setName('id')
				.setDescription('The ID of the Dare to ban')
				.setAutocomplete(true)
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
				.setAutocomplete(true)
			)
			.addStringOption(new SlashCommandStringOption()
				.setName('reason')
				.setDescription('Why are you banning this?')
			)
		)
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('server')
			.setDescription('Ban the specified Server')
			.addStringOption(new SlashCommandStringOption()
				.setName('id')
				.setDescription('The ID of the Server to ban')
				.setAutocomplete(true)
			)
			.addStringOption(new SlashCommandStringOption()
				.setName('reason')
				.setDescription('Why are you banning this?')
			)
		)
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('user')
			.setDescription('Ban the specified User')
			.addStringOption(new SlashCommandStringOption()
				.setName('id')
				.setDescription('The ID of the User to ban')
				.setAutocomplete(true)
			)
			.addStringOption(new SlashCommandStringOption()
				.setName('reason')
				.setDescription('Why are you banning this?')
			)
		),
	async execute(interaction) {

		const subcommand = interaction.options.getSubcommand();
		let didBan = false;
		switch (subcommand) {
			case 'dare':
				didBan = await new BanHandler().banDare(interaction.options.getNumber('id'), interaction.options.getString('reason'), interaction);
				break;
			case 'truth':
				didBan = await new BanHandler().banTruth(interaction.options.getNumber('id'), interaction.options.getString('reason'), interaction);
				break;
			case 'server':
				didBan = await new BanHandler().banServer(interaction.options.getString('id'), interaction.options.getString('reason'), interaction);
				break;
			case 'user':
				didBan = await new BanHandler().banUser(interaction.options.getString('id'), interaction.options.getString('reason'), interaction);
				break;
			default:
				interaction.reply('Not an Option');
				break;
		}
	},
	async autocomplete(interaction) {

		const focusedOption = interaction.options.getFocused(true);
		let choices;

		if (focusedOption.name === 'id') {
			const subcommand = interaction.options.getSubcommand();
			const db = new Database();
			const id = focusedOption.value.toLowerCase();

			try {
				switch (subcommand) {
					case 'dare':
						choices = await this.getAutocompleteChoices(db, 'dares', id, 'question');
						break;
					case 'truth':
						choices = await this.getAutocompleteChoices(db, 'truths', id, 'question');
						break;
					case 'guild':
						choices = await this.getAutocompleteChoices(db, 'servers', id, 'name');
						break;
					case 'user':
						choices = await this.getAutocompleteChoices(db, 'users', id, 'username');
						break;
					default:
						choices = [];
						break;
				}
			} catch (error) {
				console.error('Error fetching autocomplete choices:', error);
				choices = [];
			}
		}

		if (focusedOption.name === 'reason') {
			choices = banReasonList;
		}
		interaction.respond(choices);
	},

	async getAutocompleteChoices(db, collectionName, id, fieldName) {
		console.log(`Fetching autocomplete choices for collection: ${collectionName}, id: ${id}, fieldName: ${fieldName}`);
		const items = await db.like(collectionName, 'id', `%${id}%`, 20, "DESC");
		console.log(`Retrieved items:`, items);
		return items.map(item => {
			const name = `${item.id} - ${item[fieldName]}`;
			const value = item.id;
			return { name: truncateString(name, 96), value: value };
		}).filter(choice => choice !== null);
	}

}

function truncateString(str, num) {
	if (str.length < num) {
		return str
	}
	return str.slice(0, num - 3) + '...'
}
