const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandUserOption, SlashCommandStringOption, SlashCommandIntegerOption, Interaction } = require("discord.js");
const User = require("objects/user");
const Server = require("objects/server");
const Handler = require("handlers/handler");

const XP_TYPES = {
    GLOBAL: 'global',
    SERVER: 'server',
};

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
			.addIntegerOption(new SlashCommandIntegerOption()
				.setName('wager')
				.setDescription('How much XP will you wager')
				.setRequired(true)
			)
			.addStringOption(new SlashCommandStringOption()
				.setName('type')
				.setDescription('The type of XP you want to wager')
				.setRequired(true)
				.setChoices(
					{ name: "Global XP", value: XP_TYPES.GLOBAL },
					{ name: "Server XP", value: XP_TYPES.SERVER }
				)
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
			.addIntegerOption(new SlashCommandIntegerOption()
				.setName('wager')
				.setDescription('How much XP will you wager')
				.setRequired(true)
			)
			.addStringOption(new SlashCommandStringOption()
				.setName('type')
				.setDescription('The type of XP you want to wager')
				.setRequired(true)
				.setChoices(
					{ name: "Global XP", value: XP_TYPES.GLOBAL },
					{ name: "Server XP", value: XP_TYPES.SERVER }
				)
			)
		),
	nsfw: true,
	administrator: false,
/** @param {Interaction} interaction  */
	async execute(interaction) {
		if(!interaction.deferred) await interaction.deferReply({ ephemeral: true });

		const subcommand = interaction.options.getSubcommand();
		const xpType = interaction.options.getString('type');
		const wager = interaction.options.getInteger('wager');
		const user = new User(interaction.user.id);
		await user.get();

		if (!(await hasEnoughXP(user, xpType, wager, interaction))) return;

		new Handler(subcommand).giveQuestion(interaction);
	}
};

/**
 * 
 * @param {User} user 
 * @param {XP_TYPES} xpType 
 * @param {number} wager 
 * @param {Interaction} interaction 
 * @returns 
 */
async function hasEnoughXP(user, xpType, wager, interaction) {
	if (xpType === XP_TYPES.GLOBAL) {
		if (user.getTotalGlobalXP() < wager) {
			await interaction.editReply({ content: `You do not have ${wager} ${xpType} XP to wager`, ephemeral: true});
			return false;
		}
		
	} else if (xpType === XP_TYPES.SERVER) {
		const server = new Server(interaction.guildId);
		await server.load();
		const premium = await server.hasPremium();
		if (!premium) {
			await interaction.editReply({
				content: "Wagering Server XP is a premium feature. Premium is not quite ready yet, But I'm working hard to make these commands available for everyone :)",
				ephemeral: true
			});
			return false;
		}
		if (user.getTotalServerXP() < wager) {
			await interaction.editReply({ content: `You do not have ${wager} ${xpType} XP to wager`, ephemeral: true });
			return false;
		}
	}
	return true;
}
