const Database = require("./database");
const Server = require("./server");

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
		this.question = null;
		this.creator = null;
		this.isBanned = 0
		this.banReason = null;
		this.messageId = null;
		this.db = new Database();
	}

	async load() {
		const table = this.type + "s";

        const dare = await this.db.get(table, this.id);
		if(!dare) return;
		this.question = dare.question;
        this.creator = dare.creator;
        this.isBanned = dare.isBanned;
        this.banReason = dare.banReason;
		this.messageId = dare.messageId;
        if (dare.serverId) {
            this.server = new Server(dare.serverId);
            await this.server.load();
        }
        else this.server = "Pre-5"; //Pre-5 is a placeholder for dares created before the serverId was added in version 5
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

		const table = this.type + "s";

		const newQuestionId = await this.db.set(table, {
			question: this.question,
			creator: this.creator,
			isBanned: this.isBanned,
			banReason: this.banReason,
			serverId: this.server.id
		});

		this.id = newQuestionId;

		return this;
	}

	async save() {
		const table = this.type + "s";
		this.exists = true;
		return await this.db.set(table, {
			id: this.id,
			question: this.question,
			creator: this.creator,
			isBanned: this.isBanned,
			banReason: this.banReason,
			serverId: this.server.id,
			messageId: this.messageId,
		})
	}

async find(messageId) {
		const table = this.type + "s";
		const question = await this.db.query(`select id FROM ${table} WHERE messageId = ${messageId}`);
		const questionId = question[0].id;
		this.id = questionId;
		console.log(this.id);
		await this.load();
		return this;
}

	async ban(reason) {
		this.isBanned = 1;
		this.banReason = reason;
		return this.save();
	}

	async approve() {
		this.isApproved = 1;
		return this.save();
	}


	toJson() {
		let string = {}
		string.id = this.id ?? "No ID";
		string.question = this.question;
		string.creator = this.creator;
		string.isBanned = this.isBanned;
		string.banReason = this.banReason;
		return string;
	}
}

module.exports = Question