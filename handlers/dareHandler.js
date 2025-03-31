// eslint-disable-next-line no-unused-vars
const { Interaction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Guild, MessageFlags } = require('discord.js');

const Handler = require('handlers/handler.js')
// eslint-disable-next-line no-unused-vars
const User = require('objects/user.js');
const Dare = require('objects/dare.js');
const logger = require('objects/logger.js');
// eslint-disable-next-line no-unused-vars
let client = null
class DareHandler extends Handler {

	successXp = 50;
	failXp = 25; //this is subtracted from the user's xp when they fail a dare

	constructor(client) {
		super("dare")
		this.client = client
	}

	/**
	 * 
	 * @param {Interaction} interaction 
	 * @returns 
	 * @deprecated Use parent function instead
	 */
	async vote(interaction) {
		super.vote(interaction);

	}
	/**
	 * 
	 * @param {Interaction} interaction 
	 * @param {UserDare} userDare 
	 * @param {string} dareUser 
	 * @param {User} user 
	 * @returns 
	 * @deprecated Use parent function instead
	 */
	async doSkip(interaction, userDare, dareUser, user) {
		super.doSkip(interaction, userDare, dareUser, user);
	}

	/**
	 * 
	 * @param {Interaction} interaction 
	 * @param {UserDare} userDare 
	 * @param {String} dareUser 
	 * @param {User} user 
	 * @param {Server} server 
	 * @returns 
	 * @deprecated Use parent function instead
	 */
	async doVote(interaction, userDare, dareUser, user, server) {

		super.doVote(interaction, userDare, dareUser, user, server);
	}

	/**
	 * mark the dare as approved or banned
	 * @param {Interaction} interaction 
	 * @param {string<"ban"|"approve"} decision 
	 */
	async setDare(interaction, decision) {
		if (!interaction.deferred) await interaction.deferReply({ ephemeral: true })
		let dare = await new Dare().find(interaction.message.id);
		switch (decision) {
			case "ban":
				this.getBanReason(interaction, dare.id);
				break;
			case 'unban':
				await dare.unBan();
				logger.updateDare(dare);
				interaction.editReply("Truth has been Unbanned");
				break;
			case "approve":
				this.approve(interaction, dare);
				break;
		}

	}

}

module.exports = DareHandler;