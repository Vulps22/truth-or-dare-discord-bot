const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandStringOption, SlashCommandUserOption } = require("discord.js")

const TOKEN = process.env['TOKEN']
const CLIENT_ID = process.env['CLIENT_ID']
const GUILD_ID = process.env['GUILD_ID']

const modCommands = [
	{
		name: "update-commands",
		description: "You cannot read this description and you are not in the Truth Or Dare Online 18+ development server."
	},
	{
		name: 'register',
		description: 'Only required if you want to create a new Truth or Dare'
	},
	{
		name: 'reportdare',
		description: 'Report a Dare that might be dangerous or illegal.'
	},
	{
		name: 'reporttruth',
		description: 'Report a Truth that might be dangerous or illegal.'
	},
	{
		name: "reportguild",
		description: 'Report a Guild that allows anybody under 18 to use this bot, or uses this bot to break discord ToS'
	}
];

function updateGlobalCommands() {
	var truthCommand = new SlashCommandBuilder()
		.setName('truth')
		.setDescription('Get a Truth question. Remember, you **must** answer honestly!')
		.setNSFW(true);

	var dareCommand = new SlashCommandBuilder()
		.setName('dare')
		.setDescription('Get a Dare. Remember to prove you did it ;)')
		.setNSFW(true);

	var createCommand = new SlashCommandBuilder()
		.setName('create')
		.setDescription('Add your own Truth or Dare to the Global Pool')
		.setNSFW('true')
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('dare')
			.setDescription('Add a new Dare to the Global Pool')
			.addStringOption(new SlashCommandStringOption()
				.setName('text')
				.setDescription('What would you like your Dare to say? Remember to keep it legal and safe')
				.setRequired('true')
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
		);

	var randomCommand = new SlashCommandBuilder()
		.setName('random')
		.setDescription('Get a random Truth or Dare, let the bot decide!')
		.setNSFW(true);

	var acceptCommand = new SlashCommandBuilder()
		.setName('accept-terms')
		.setDescription('Required by ALL Servers before users can use any commands')
		.setNSFW(true);

	var setupCommand = new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Required by ALL Servers before users can use any commands')
		.setNSFW(true);

	var giveCommand = new SlashCommandBuilder()
		.setName('give')
		.setDescription('Challenge another player with a Truth or Dare Question')
		.setNSFW(true)
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
		)


}
/*
const globalCommands = [
	{
		name: 'truth',
		description: 'Get a Truth question. Remember, you **must** answer honestly!',
		nsfw: true
	},
	{
		name: 'dare',
		description: 'Get a Dare. Remember to prove you did it ;)',
		nsfw: true
	},
	{
		name: 'createdare',
		nsfw: true,
		description: 'Create a Dare for others. Remember to keep it safe &legal',
		type: 1,
		options: [{
			name: "text",
			type: 3,
			description: "What would you like your dare to say? Remember to keep it legal and safe"
		}]
	},
	{
		name: 'createtruth',
		nsfw: true,
		description: 'Create a Truth for others. Remember to keep it safe & legal',
		type: 1,
		options: [{
			name: "text",
			type: 3,
			description: "What would you like your dare to say? Remember to keep it legal and safe"
		}]
	},
	{
		name: 'random',
		nsfw: true,
		description: 'Get a random truth or dare, let the bot decide!',
	},
	{
		name: 'accept-terms',
		description: 'Required by ALL Servers before users can use any commands'
	},
	{
		name: 'setup',
		description: 'Required by ALL Servers before users can use any commands'
	},
	{
		name: 'givedare',
		nsfw: true,
		description: 'Dares a user to do something',
		options: [
			{
				name: 'user',
				type: 6,
				description: 'The user to give the dare to',
				required: true,
			},
			{
				name: 'dare',
				type: 3,
				description: 'The dare to give',
				required: true,
			},
		],
	},
	{
		name: 'report',
		description: 'Report a truth, dare, or this server.',
		options: [
			{
				name: 'type',
				type: 1,
				description: 'The type of report (truth, dare, server).',
				required: true,
				choices: [
					{ name: 'Truth', value: 'truth' },
					{ name: 'Dare', value: 'dare' },
					{ name: 'Server', value: 'guild' },
				],
			},
			{
				name: 'id',
				type: 'STRING',
				description: 'The ID of the truth, dare. Not applicable to Servers.',
				required: false,
			},
		]
	}
];
*/

module.exports = {
	modCommands,
	//globalCommands
};