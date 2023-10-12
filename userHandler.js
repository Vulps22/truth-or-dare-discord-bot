require('dotenv').config();
const { EmbedBuilder, Embed } = require('discord.js');

const Handler = require('./handler.js')
const Question = require('./question.js');
const Database = require('./database.js');
const embedder = require('./embedder.js');

class UserHandler extends Handler {

	db;

	constructor() {
		super();
		this.db = new Database();
	}

	async findGuild(id) {
		if (!id) return;
		return this.db.get('guilds', id)
			.then(guild => {
				return guild;
			});
	}

	startSetup(interaction) {

		const embed = this.getTerms();
		const guild = this.findGuild(interaction.guildId).then((data) => {
			if (!data) this.db.set('guilds', { id: interaction.guildId, name: interaction.guild.name, hasAccepted: 0, isBanned: 0 }).then(() => {
				interaction.reply({ embeds: [embed] });
			})
			else {
				if (!data.hasAccepted) interaction.reply('Setup has already been started. Please use /accept-terms to continue.');
				else interaction.reply('You have already accepted my terms');
			}
		})

	}

	async acceptSetup(interaction) {

		const guild = await this.findGuild(interaction.guildId).then((data) => {
			if (!data) {
				interaction.reply("You must first use /setup and read the Terms of Use");
				return;
			}

			if (data.hasAccepted) {
				interaction.reply('You have already accepted my terms');
				return;
			}

			let g = data;
			g.id = interaction.guildId;
			g.hasAccepted = 1;
			this.db.set('guilds', g);
			interaction.reply({ embeds: [embedder.accepted()] });
		})
	}

	getTerms() {
		return embedder.terms();
	}

	static updateServerCount(client) {
		// Get the status channel
		const statusChannel = client.channels.cache.get(process.env.STATUS_CHANNEL_ID);

		// Update channel name with guild count
		statusChannel.setName(`Connected Servers: ${client.guilds.cache.size}`);

		console.log(`Connected Servers: ${client.guilds.cache.size}`);
	}
}

module.exports = UserHandler