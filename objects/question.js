const Database = require("objects/database");
const Server = require("objects/server");
const User = require("objects/user");



class Question {
	/**
	 * @type {Database}
	 */
	db;
	/**
	 * @type {string<"dare"|"truth">}
	 */
	type;

	/**
	 * @type {Server}
	 */
	server;

	exists = false;

	constructor(id, type = '') {
		this.id = id;
		this.type = type;
		this.question = ' ';
		this.creator = ' ';
		this.isApproved = 0;
		this.approvedBy = ' ';
		this.isBanned = 0
		this.banReason = ' ';
		this.bannedBy = ' ';
		this.messageId = ' ';
		this.db = new Database();
	}

	async load() {

		const question = await this.db.get('questions', this.id);
		if (!question) return;
		this.type = question.type;
		this.question = question.question;
		this.creator = question.creator;
		this.isApproved = question.isApproved;
		this.approvedBy = question.approvedBy;
		this.isBanned = question.isBanned;
		this.banReason = question.banReason;
		this.bannedBy = question.bannedBy;
		this.messageId = question.messageId;
		if (question.serverId) {
			this.server = new Server(question.serverId);
			await this.server.load();
		}
		else this.server = "Pre-5"; //Pre-5 is a placeholder for question created before the serverId was added in version 5
		this.exists = true;
		return this;
	}

	/**
	 * Creates and returns an array of Question instances populated from input data.
	 * @param {Array<Object>} questionDataArray - Array of objects containing question data.
	 * @returns {Question[]} - Array of populated Question instances.
	 */
	static loadMany(questionDataArray) {
		return questionDataArray.map(data => {
			const question = new Question(data.id, data.type);

			// Directly assign provided data to the question instance, avoiding any database calls
			question.question = data.question || ' ';
			question.creator = data.creator || ' ';
			question.isApproved = data.isApproved || 0;
			question.approvedBy = data.approvedBy || ' ';
			question.isBanned = data.isBanned || 0;
			question.banReason = data.banReason || ' ';
			question.bannedBy = data.bannedBy || ' ';
			question.messageId = data.messageId || ' ';
			question.exists = true;

			if (data.serverId) {
				question.server = new Server(data.serverId);
				question.server.name = data.serverName;
			} else {
				question.server = { name: 'Server Data No Longer Exists' };
			}

			return question;
		});
	}

	async create(question, creator, serverId) {
		if (!question || !creator || !serverId) {
			throw new Error("Question, creator or serverId is not defined in new Question");
		}

		this.question = question;
		this.creator = creator;
		this.server = new Server(serverId);
		await this.server.load();

		throw new Error("Test BROKEN MOTHER FUCKER!");

		const newQuestionId = await this.db.set('questions', {
			question: this.question,
			creator: this.creator,
			isBanned: this.isBanned,
			isApproved: this.isApproved,
			approvedBy: this.approvedBy,
			banReason: this.banReason,
			serverId: this.server.id,
			type: this.type,
		});

		this.id = newQuestionId;
		this.exists = true;
		return this;
	}

	async save() {
		this.exists = true;
		if (!this.messageId) throw new Error("Missing Message ID: " + this.id + this.type);
		let savable = {
			id: this.id,
			question: this.question,
			creator: this.creator,
			isApproved: this.isApproved,
			isBanned: this.isBanned,
			banReason: this.banReason,
			bannedBy: this.bannedBy,
			serverId: this.server.id ?? 'pre-v5',
			messageId: this.messageId,
			type: this.type,
		}

		return await this.db.set('questions', savable)
	}

	async getApprovedByUser() {
		if (!this.isApproved) return false;
		if (this.approvedBy) return await new User(this.approvedBy).get();
		return "Untracked";
	}

	async getBannedByUser() {
		if (!this.isBanned) return false;

		if (this.bannedBy) return await new User(this.bannedBy).get();
		return "Untracked";
	}

	async find(messageId) {
		/** @type {Array} */
		const question = await this.db.query(`select id FROM questions WHERE messageId = ${messageId}`);
		if (!question || question.length == 0) return null;
		const questionId = question[0].id;
		this.id = questionId;
		await this.load();
		return this;
	}

	/**
	 * 
	 * @param {"truth" | "dare"} type 
	 */
	static async collect(type) {
		const db = new Database();

		const questions = await db.query(`SELECT * FROM questions WHERE type='${type}' AND isBanned=0 AND isApproved=1`);

		return questions ?? [];
	}

	async ban(reason) {
		this.isBanned = 1;
		this.banReason = reason;
		return this.save();
	}

	async unBan() {
		this.isBanned = 0;
		this.banReason = null;
		return this.save();
	}

	async approve() {
		this.isApproved = 1;
		await this.save();
	}

	async getCreatorUsername() {
		const user = new User(this.creator);
		await user.get();

		return user.username;
	}

	toJson() {
		let string = {}
		string.id = this.id ?? "No ID";
		string.question = this.question;
		string.creator = this.creator;
		string.isApproved = this.isApproved;
		string.approvedBy = this.approvedBy;
		string.isBanned = this.isBanned;
		string.banReason = this.banReason;
		string.bannedBy = this.bannedBy;
		string.type = this.type;
		return string;
	}
}

module.exports = Question