// eslint-disable-next-line no-unused-vars
const { Interaction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Guild, MessageFlags } = require('discord.js');

const Handler = require('handlers/handler.js')
const UserDare = require('objects/userDare.js');
// eslint-disable-next-line no-unused-vars
const User = require('objects/user.js');
const Server = require('objects/server.js');
const Dare = require('objects/dare.js');
const logger = require('objects/logger.js');
const Question = require('objects/question.js');
const GivenQuestion = require('objects/givenQuestion.js');
const Purchasable = require('objects/purchasable');
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
	 * @param {UserDare} userDare 
	 * @param {Interaction} interaction 
	 * @returns 
	 * @deprecated Use createUpdatedQuestionEmbed instead
	 */
	async createUpdatedDareEmbed(userDare, interaction) {
		let dare = await userDare.getQuestion();
		let question = dare.question;
		let creator = this.getCreator(dare, interaction);
		const username = (await creator).username;

		let dareText = `${question}\n\n **Votes:** ${userDare.doneCount} Done | ${userDare.failedCount} Failed`;

		return new EmbedBuilder()
			.setTitle('Dare!')
			.setDescription(dareText)
			.setColor('#6A5ACD')
			.setFooter({ text: `Requested by ${userDare.username} | Created By ${username} | #${dare.id}`, iconURL: userDare.image });
	}

	createActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('dare_done')
					.setLabel('DONE')
					.setStyle(ButtonStyle.Success), // Green button
				new ButtonBuilder()
					.setCustomId('dare_failed')
					.setLabel('FAILED')
					.setStyle(ButtonStyle.Danger), // Red button
				new ButtonBuilder()
					.setCustomId('dare_skip')
					.setLabel('SKIP')
					.setStyle(ButtonStyle.Secondary), // Red button
			);
	}

	createPassedActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('dare_done')
					.setLabel('PASSED')
					.setDisabled(true)
					.setStyle(ButtonStyle.Success), // Green button
			);
	}

	createFailedActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('dare_failed')
					.setLabel('FAILED')
					.setDisabled(true)
					.setStyle(ButtonStyle.Danger), // Red button
			);
	}

	createSkippedActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('dare_skipped')
					.setLabel('SKIPPED')
					.setDisabled(true)
					.setStyle(ButtonStyle.Secondary), // Red button
			);
	}

	/**
	 * 
	 * @param {Interaction} interaction 
	 * @returns 
	 */
	async vote(interaction) {
		if (!interaction.deferred) await interaction.deferReply({ content: "Registering your vote", ephemeral: true })
		const userDare = await new UserDare().load(interaction.message.id, 'dare');

		if (!userDare) {
			await interaction.editReply("I'm sorry, I couldn't find the dare to track votes. This is a brain fart. Please reach out for support on the official server.");
			logger.error(`Brain Fart: Couldn't find dare to track votes. Message ID missing`);
			return;
		}

		//load the user		
		/** @type {User} */
		const user = await userDare.getUser();
		const serverUserLoaded = await user.loadServerUser(interaction.guildId);

		if (!serverUserLoaded) {
			await interaction.editReply("Failed to load server user data. Please try again.");
			logger.error(`Failed to load server user data for user ${user.id} in server ${interaction.guildId}`);
			return;
		}

		//load the server
		const server = new Server(interaction.guildId);
		await server.load();

		const dareUser = userDare.getUserId();

		if (interaction.customId === 'dare_skip') {
			this.doSkip(interaction, userDare, dareUser, user);
		} else {
			this.doVote(interaction, userDare, dareUser, user, server)
		}

	}
	/**
	 * 
	 * @param {Interaction} interaction 
	 * @param {UserDare} userDare 
	 * @param {string} dareUser 
	 * @param {User} user 
	 * @returns 
	 */
	async doSkip(interaction, userDare, dareUser, user) {

		if (dareUser != interaction.user.id) {
			interaction.editReply({ content: "You can't skip someone else's dare!", ephemeral: true });
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
					content: "Uh oh! You're out of Skips!\nNot to worry, You can earn up to 10 skips by voting for the bot every day on [top.gg](https://top.gg/bot/1079207025315164331/vote)!",
					components: [row],
					flags: MessageFlags.Ephemeral
				});
			return;
		}

		const embed = await this.createUpdatedDareEmbed(userDare, interaction);
		const row = await this.createSkippedActionRow();

		//use the userDare.messageId to edit the embed in the message
		await interaction.message.edit({ embeds: [embed], components: [row] });
		await user.burnVote();
		await interaction.editReply({ content: `Your truth has been skipped! You have ${user.voteCount} skips remaining!`, ephemeral: true });

	}

	/**
	 * 
	 * @param {Interaction} interaction 
	 * @param {UserDare} userDare 
	 * @param {String} dareUser 
	 * @param {User} user 
	 * @param {Server} server 
	 * @returns 
	 */
	async doVote(interaction, userDare, dareUser, user, server) {

		if (dareUser == interaction.user.id && !this.ALPHA) {
			interaction.editReply({ content: "You can't vote on your own dare!", ephemeral: true });
			return;
		}

		const vote = interaction.customId === 'dare_done' ? 'done' : 'failed';

		const couldVote = await userDare.vote(interaction.user.id, vote);
		if (!couldVote && !this.ALPHA) {
			await interaction.editReply({ content: "You've already voted on this dare!", ephemeral: true });
			return;
		}

		const embed = await this.createUpdatedDareEmbed(userDare, interaction);

		let row = this.createActionRow();

		if (userDare.doneCount >= this.vote_count) {
			row = this.createPassedActionRow();

			user.addXP(this.successXp);
			user.addServerXP(server.dare_success_xp);

		} else if (userDare.failedCount >= this.vote_count) {
			row = this.createFailedActionRow();

			user.subtractXP(this.failXp);
			user.subtractServerXP(server.dare_fail_xp);
		}

		//use the userDare.messageId to edit the embed in the message
		await interaction.message.edit({ embeds: [embed], components: [row] });
		await interaction.editReply({ content: "Your vote has been recorded!", ephemeral: true });
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