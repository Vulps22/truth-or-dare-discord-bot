const Database = require("./database");
const Server = require("./server");
const User = require("./user");

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

	constructor(id, type) {
		this.id = id;
		this.type = type;
		this.question = ' ';
		this.creator = ' ';
		this.isApproved = 0;
		this.isBanned = 0
		this.banReason = ' ';
		this.messageId = ' ';
		this.db = new Database();
	}

	async load() {

		const question = await this.db.get('questions', this.id);
		if (!question) return;
		this.question = question.question;
		this.creator = question.creator;
		this.isApproved = question.isApproved;
		this.isBanned = question.isBanned;
		this.banReason = question.banReason;
		this.messageId = question.messageId;
		if (question.serverId) {
			this.server = new Server(question.serverId);
			await this.server.load();
		}
		else this.server = "Pre-5"; //Pre-5 is a placeholder for question created before the serverId was added in version 5
		this.exists = true;
		return this;
	}

	async create(question, creator, serverId) {
		if (!question || !creator || !serverId) {
			throw new Error("Question, creator or serverId is not defined in new Question");
		}

		this.question = question;
		this.creator = creator;
		this.server = new Server(serverId);
		await this.server.load();


		const newQuestionId = await this.db.set('questions', {
			question: this.question,
			creator: this.creator,
			isBanned: this.isBanned,
			isApproved: this.isApproved,
			banReason: this.banReason,
			serverId: this.server.id,
			type: this.type,
		});

		this.id = newQuestionId;

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
			serverId: this.server.id ?? 'pre-v5',
			messageId: this.messageId,
			type: this.type,
		}

		return await this.db.set('questions', savable)
	}

	async find(messageId) {
		console.log(messageId)

		const question = await this.db.query(`select id FROM questions WHERE messageId = ${messageId}`);
		if (!question) return null;
		const questionId = question[0].id;
		this.id = questionId;
		console.log(this.id);
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
		string.isBanned = this.isBanned;
		string.banReason = this.banReason;
		string.type = this.type;
		return string;
	}
}

module.exports = Question