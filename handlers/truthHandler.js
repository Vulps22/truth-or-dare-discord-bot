const { 
	/* eslint-disable no-unused-vars */
	Interaction, 
	EmbedBuilder, 
	ActionRowBuilder, 
	ButtonBuilder, 
	ButtonStyle, 
	Client, 
	MessageFlags
} = require('discord.js');

const Handler = require('handlers/handler.js')
const UserTruth = require('objects/userTruth.js');
const User = require('objects/user.js');
const Server = require('objects/server.js');
const Truth = require('objects/truth.js');
const logger = require('objects/logger.js');
const Question = require('objects/question.js');
const GivenQuestion = require('objects/givenQuestion.js');
const Purchasable = require('objects/purchasable');
let client = null;

class TruthHandler extends Handler {

	successXp = 40;
	failXp = 40;

	constructor(client) {
		super("truth")
		this.client = client
	}

	/**
 * mark the truth as approved or banned
 * @param {Interaction} interaction 
 * @param {string<"ban"|"approve">} decision 
 */
	async setTruth(interaction, decision) {
		if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });
		let truth = await new Truth().find(interaction.message.id);
		switch (decision) {
			case "ban":
				this.getBanReason(interaction, truth.id);
				break;
			case 'unban':
				await truth.unBan();
				logger.updateTruth(truth);
				interaction.editReply("Truth has been Unbanned");
				break;
			case "approve":
				this.approve(interaction, truth);
				break;
		}

	}
}

module.exports = TruthHandler;