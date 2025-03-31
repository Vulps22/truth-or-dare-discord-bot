const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandNumberOption, SlashCommandStringOption, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message } = require("discord.js");
const Database = require("objects/database")
const { env } = require("process");
const BanHandler = require("handlers/banHandler");

module.exports = {
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
				.setAutocomplete(true)
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
				.setAutocomplete(true)
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
				.setAutocomplete(true)
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
				.setAutocomplete(true)
			)
		),
	async execute(interaction) {

		if(!interaction.deferred) await interaction.deferReply({ ephemeral: true });

		const subcommand = interaction.options.getSubcommand();
		let id;
		let didBan = false;
		switch (subcommand) {
			case 'dare':
			case 'truth':
				id = interaction.options.getNumber('id')
				didBan = await new BanHandler().banQuestion(id, interaction.options.getString('reason'), interaction, true, false);
				break;
			case 'server':
				id = interaction.options.getString('id')
				didBan = await new BanHandler().banServer(id, interaction.options.getString('reason'), interaction);
				break;
			case 'user':
				id = 
				didBan = await new BanHandler().banUser(id, interaction.options.getString('reason'), interaction);
				break;
			default:
				interaction.reply('Not an Option');
				break;
		}

		if(didBan) {
			interaction.editReply({ content: `Successfully banned ${id}`, ephemeral: true });
		}
		else {
			interaction.editReply({ content: `Failed to ban ${id}`, ephemeral: true });
		}
	},
	async autocomplete(interaction) {

		const focusedOption = interaction.options.getFocused(true);
		let choices;
		const subcommand = interaction.options.getSubcommand();

		if (focusedOption.name === 'id') {
			
			const db = new Database();
			const id = focusedOption.value.toLowerCase();

			try {
				switch (subcommand) {
					case 'dare':
						choices = await this.getAutocompleteChoices(db, 'dare', id, 'question');
						break;
					case 'truth':
						choices = await this.getAutocompleteChoices(db, 'truth', id, 'question');
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
			choices = [];
			switch (subcommand) {
				case 'dare':
				case 'truth':
					choices = new BanHandler().banReasonList;
					break;
				case 'server':
					choices = new BanHandler().serverBanReasonList;
					break;
				case 'user':
					choices = new BanHandler().UserBanReasonList;
					break;
			}
		}
		interaction.respond(choices);
	},

	/**
	 * 
	 * @param {Database} db 
	 * @param {*} collectionName 
	 * @param {*} id 
	 * @param {*} fieldName 
	 * @returns 
	 */
	async getAutocompleteChoices(db, collectionName, id, fieldName) {
		console.log(`Fetching autocomplete choices for collection: ${collectionName}, id: ${id}, fieldName: ${fieldName}`);
		let items = [];
		if(collectionName !== "truth" && collectionName !== "dare") {
			items = await db.like(collectionName, 'id', `%${id}%`, 20, "DESC");
		} else {
			items = await db.query(`SELECT * FROM questions WHERE (question LIKE '%${id}%' OR id LIKE '%${id}%') AND isBanned = 0 AND type='${collectionName}' ORDER BY question DESC LIMIT 20`);
		}
		//console.log(`Retrieved items:`, items);
		let options = items.map(item => {
			const name = `${item.id} - ${item[fieldName]}`;
			const value = item.id;
			return { name: truncateString(name, 96), value: value };
		}).filter(choice => choice !== null);

		console.log(`Autocomplete options:`, options);

		return options;
	}

}

function truncateString(str, num) {
	if (str.length < num) {
		return str
	}
	return str.slice(0, num - 3) + '...'
}
