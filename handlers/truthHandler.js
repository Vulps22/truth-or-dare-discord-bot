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
	 * 
	 * @param {UserTruth} userTruth 
	 * @param {Interaction} interaction 
	 * @returns Promise<EmbedBuilder>
	 * @deprecated use createUpdatedQuestionEmbed instead
	 */
	async createUpdatedTruthEmbed(userTruth, interaction) {
		let truth = await userTruth.getQuestion();
		let question = truth.question;
		let creator = this.getCreator(truth, this.client);

		let truthText = `${question}\n\n **Votes:** ${userTruth.doneCount} Done | ${userTruth.failedCount} Failed`;

		return new EmbedBuilder()
			.setTitle('truth!')
			.setDescription(truthText)
			.setColor('#6A5ACD')
			.setFooter({ text: `Requested by ${userTruth.username} | Created By ${creator.username} | #${truth.id}`, iconURL: userTruth.image });
	}

	createActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('truth_done')
					.setLabel('DONE')
					.setStyle(ButtonStyle.Success), // Green button
				new ButtonBuilder()
					.setCustomId('truth_failed')
					.setLabel('FAILED')
					.setStyle(ButtonStyle.Danger), // Red button
				new ButtonBuilder()
					.setCustomId('truth_skip')
					.setLabel('SKIP')
					.setStyle(ButtonStyle.Secondary), // Red button
			);
	}

	createSkippedActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('truth_skipped')
					.setLabel('SKIPPED')
					.setDisabled(true)
					.setStyle(ButtonStyle.Secondary), // Red button
			);
	}

	createPassedActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('truth_done')
					.setLabel('PASSED')
					.setDisabled(true)
					.setStyle(ButtonStyle.Success), // Green button
			);
	}

	createFailedActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('truth_failed')
					.setLabel('FAILED')
					.setDisabled(true)
					.setStyle(ButtonStyle.Danger), // Red button
			);
	}

	/**
	 * 
	 * @param {*} messageId 
	 * @param {*} userId 
	 * @param {*} truthId 
	 * @param {*} serverId 
	 * @param {*} username 
	 * @param {*} image 
	 * @deprecated use saveQuestionMessageId instead
	 **/
	async saveTruthMessageId(messageId, userId, truthId, serverId, username, image) {
		if (!messageId) {
			await interaction.channel.send("I'm sorry, I couldn't save the truth to track votes. This is a brain fart. Please reach out for support on the official server.");
			logger.error(`Brain Fart: Couldn't save truth to track votes. Message ID missing`);
		} else {
			const userTruth = new UserTruth(messageId, userId, truthId, serverId, username, image);
			// Assuming userTruth.save() is an asynchronous operation to save the data
			await userTruth.save();
		}
	}

	/**
	 * 
	 * @param {Interaction} interaction 
	 * @returns 
	 */
	async vote(interaction) {
		if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });
		const userTruth = await new UserTruth().load(interaction.message.id, 'truth');

		if (!userTruth) {
			await interaction.editReply("I'm sorry, I couldn't find the truth to track votes. This is a brain fart. Please reach out for support on the official server.");
			logger.error(`Brain Fart: Couldn't find truth to track votes. Message ID missing`);
			return;
		}

		//load the user		
		/** @type {User} */
		const user = await userTruth.getUser();
		await user.loadServerUser(interaction.guildId);
		//load the server
		const server = new Server(interaction.guildId);
		await server.load();

		const truthUser = userTruth.getUserId();

		if (interaction.customId === 'truth_skip') {
			this.doSkip(interaction, userTruth, truthUser, user);
		} else {
			this.doVote(interaction, userTruth, truthUser, user, server)
		}

	}
	/**
	 * 
	 * @param {Interaction} interaction 
	 * @param {userTruth} userTruth 
	 * @param {string} truthUser 
	 * @param {User} user 
	 * @returns 
	 */
	async doSkip(interaction, userTruth, truthUser, user) {

		if (truthUser != interaction.user.id) {
			interaction.editReply({ content: "You can't skip someone else's truth!", ephemeral: true });
			return;
		}


		if (!user.hasValidVote()) {

			/**
			 * @type {Purchasable}
			 */
			const purchasable = await new Purchasable(Purchasable.SKIP10).load();

			const row = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setLabel('Vote on Top.gg')
					.setStyle(ButtonStyle.Link)
					.setURL('https://top.gg/bot/1079207025315164331/vote'),
				new ButtonBuilder()
					.setStyle(ButtonStyle.Premium)
					.setSKUId(purchasable.skuId)
			);
			interaction.editReply(
				{
					content: "Uh oh! You're out of Skips!\nNot to worry, You can earn up to 10 skips by voting for the bot every day on [top.gg](https://top.gg/bot/1079207025315164331/vote)! \n\nYou can also buy 10 skips right now by clicking the button below! (the 10 skip limit does not apply to purchased skips)",
					components: [row],
					flags: MessageFlags.Ephemeral
				});
			return;
		}

		const embed = await this.createUpdatedTruthEmbed(userTruth, interaction);
		const row = await this.createSkippedActionRow();

		//use the userTruth.messageId to edit the embed in the message
		await interaction.message.edit({ embeds: [embed], components: [row] });
		await user.burnVote();
		await interaction.editReply({ content: `Your truth has been skipped! You have ${user.voteCount} skips remaining!`, ephemeral: true });



	}


	async doVote(interaction, userTruth, truthUser, user, server) {

		if (truthUser == interaction.user.id && !this.ALPHA) {
			interaction.editReply({ content: "You can't vote on your own truth!", ephemeral: true });
			return;
		}

		const vote = interaction.customId === 'truth_done' ? 'done' : 'failed';

		const couldVote = await userTruth.vote(interaction.user.id, vote);
		if (!couldVote && !this.ALPHA) {
			await interaction.editReply({ content: "You've already voted on this truth!", ephemeral: true });
			return;
		}

		const embed = await this.createUpdatedTruthEmbed(userTruth, interaction);

		let row = this.createActionRow();

		if (userTruth.doneCount >= this.vote_count) {
			row = this.createPassedActionRow();

			user.addXP(this.successXp);
			user.addServerXP(server.truth_success_xp);

		} else if (userTruth.failedCount >= this.vote_count) {
			row = this.createFailedActionRow();

			user.subtractXP(this.failXp);
			user.subtractServerXP(server.truth_fail_xp);

		}

		//use the userTruth.messageId to edit the embed in the message
		await interaction.message.edit({ embeds: [embed], components: [row] });
		await interaction.editReply({ content: "Your vote has been recorded!", ephemeral: true });
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