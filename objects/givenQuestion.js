const { Interaction, ButtonBuilder, ComponentBuilder, EmbedBuilder, ButtonStyle } = require('discord.js')
const Database = require("./database");
const Server = require("./server");
const User = require("./user");
const { ActionRowBuilder } = require('@discordjs/builders');
const Question = require('./question');

class GivenQuestion {

	/**
	 * @type {string<"dare"|"truth">}
	 */
	type;
	id;
	question;
	serverId;
	senderId;
	targetId;
	messageId;
	doneCount = 0;
	failCount = 0;
	skipped = false;
	wager = 0;
	xpType = global;
	_loaded = false;


	/**
	 * 
	 * @param {string} id 
	 * @returns {GivenQuestion}
	 */
	static async load(id) {
		const db = new Database();
		const data = await db.get('given_questions', id);
		if (!data) return null;



		return GivenQuestion.fromObject(data);
	}

	static fromObject(data) {
		const question = new GivenQuestion();
		question.id = data.id;
		question.question = data.question;
		question.senderId = data.senderId;
		question.targetId = data.targetId;
		question.serverId = data.serverId;
		question.doneCount = data.doneCount;
		question.failCount = data.failCount;
		question.skipped = data.skipped ? true : false;
		question.wager = data.wager;
		question.xpType = data.xpType;
		question.type = data.type;
		question.messageId = data.messageId;

		return question;
	}

	/**
	 * 
	 * @param {Interaction} interaction 
	 * @param {string} question 
	 * @param {string} senderId 
	 * @param {string} targetId 
	 * @param {string} serverId 
	 * @param {number} wager 
	 * @returns 
	 */
	static async create(interaction, text, senderId, targetId, serverId, wager, xpType, type) {

		const question = {}

		question.question = text;
		question.senderId = senderId;
		question.targetId = targetId;
		question.serverId = serverId;
		question.doneCount = 0;
		question.failCount = 0;
		question.skipped = false;
		question.wager = wager;
		question.xpType = xpType
		question.type = type;

		const db = new Database();
		const id = await db.set('given_questions', question);
		question.id = id;

		const givenQuestion = GivenQuestion.fromObject(question);

		const message = givenQuestion.createEmbed();


		const sentMessage = await interaction.channel.send({ embeds: [message.embed], components: [message.row], fetchReply: true })

		givenQuestion.messageId = sentMessage.id;
		await givenQuestion.save();

		return givenQuestion;
	}

	async save() {
		this.exists = true;
		let savable = {
			id: this.id,
			senderId: this.senderId,
			targetId: this.targetId,
			serverId: this.serverId,
			question: this.question,
			messageId: this.messageId ?? null,
			type: this.type,
			doneCount: this.doneCount,
			failCount: this.failCount,
			skipped: this.skipped,
			wager: this.wager,
			xpType: this.xpType
		}

		const db = new Database();

		return await db.set('given_questions', savable)
	}

	static async find(messageId) {

		const db = new Database();
		const data = await db.query(`select * FROM given_questions WHERE messageId = '${messageId}'`);

		if (!data) return null;

		const given = GivenQuestion.fromObject(data[0]);

		return given;

	}

	async getCreatorUsername() {
		const user = new User(this.creator);
		await user.get();

		return user.username;
	}

	async getServer() {

		const server = new Server(this.id);
		await server.load();
		return server;
	}

	async getTarget() {

		const user = new User(this.targetId);
		await user.get();
		return user;
	}

	async getSender() {

		const user = new User(this.senderId);
		await user.get();
		return user;
	}

	async incrementDone() {
		this.doneCount++
		this.save();
		return this.doneCount;
	}

	async incrementFail() {
		this.failCount++
		this.save();
		return this.failCount;
	}

	async skip() {
		this.skipped = true;
		this.save();
	}

	/**
	 * 
	 * @returns {{embed: EmbedBuilder, row: ActionRowBuilder}}
	 */
	createEmbed() {
		// Construct the message to send
		const messageText = `<@${this.targetId}>, <@${this.senderId}> has ${this.type == 'dare' ? 'dared you to' : 'asked you'}  ${this.question}!\n\nPassing this is worth ${this.wager} of their XP\n\n Done: ${this.doneCount} | Failed: ${this.failCount}`;
		// Create an embed with the message and send it
		const embed = new EmbedBuilder()
			.setTitle("You've been dared!")
			.setDescription(messageText)

		const row = this.getActionRow();
		return { embed: embed, row: row }
	}

	getActionRow() {
		let actionRow = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('given_done')
					.setLabel('DONE')
					.setStyle(ButtonStyle.Success), // Green button
				new ButtonBuilder()
					.setCustomId('given_failed')
					.setLabel('FAILED')
					.setStyle(ButtonStyle.Danger), // Red button
				new ButtonBuilder()
					.setCustomId('given_skip')
					.setLabel('SKIP')
					.setStyle(ButtonStyle.Secondary), // Red button
			);
		if (this.doneCount >= my.required_votes) {
			actionRow = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('given_done')
						.setLabel('PASSED')
						.setStyle(ButtonStyle.Success)
						.setDisabled(true)
				)
		} else if (this.failCount >= my.required_votes) {
			actionRow = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('given_fail')
						.setLabel('FAILED')
						.setStyle(ButtonStyle.Danger)
						.setDisabled(true)
				)
		} else if (this.skipped) {
			actionRow = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('given_skip')
						.setLabel('SKIPPED')
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(true)
				)
		}

		return actionRow;
	}
}

module.exports = GivenQuestion