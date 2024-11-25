const Database = require("objects/database");
const Question = require("objects/question");
const Server = require("objects/server");

class Report {

	id;
	db;
	type;
	reason;
	senderId;
	offenderId;
	serverId;
	offender;

	constructor(id = null) {
		this.id = id;
		this.db = new Database();
		this.type = null;
		this.reason = null;
		this.senderId = null;
		this.offenderId = null;
		this.serverId = null;
		this.offender = null;
	}

	/**
	 * Loads the report data from the database based on the ID.
	 * @returns {Promise<boolean>} - Returns true if loaded successfully, false otherwise.
	 */
	async load() {
		const reportData = await this.db.get('reports', this.id);

		if (!reportData) {
			console.error(`Report with ID ${this.id} not found`);
			return false;
		}

		this.type = reportData.type;
		this.reason = reportData.reason;
		this.senderId = reportData.senderId;
		this.offenderId = reportData.offenderId;
		this.serverId = reportData.serverId;

		await this.loadOffender();
		return true;
	}

	/**
	 * Loads the offender based on the report type.
	 */
	async loadOffender() {
		if (this.type === "truth" || this.type === "dare") {
			// Load offender data from the merged "questions" table
			const offenderData = await this.db.get("questions", this.offenderId);
			if (offenderData) {
				this.offender = new Question(offenderData.id, offenderData.type);
				await this.offender.load();
			} else {
				console.error("Offender not found in database");
			}
		} else if (this.type === "server") {
			// Load the server data if the offender type is 'server'
			this.offender = new Server(this.offenderId);
			await this.offender.load();
			if (!this.offender._loaded) {
				console.error("Server not found in database");
			}
		}
	}

	/**
	 * Retrieves the report instance by calling `load()` and returning `this`.
	 * @returns {Promise<Report|null>} - Returns the current Report instance if loaded successfully, otherwise null.
	 */
	async get() {
		const loaded = await this.load();
		return loaded ? this : null;
	}


	/**
	 * Saves the report data to the database.
	 */
	async save() {
		const reportData = {
			type: this.type,
			senderId: this.senderId,
			reason: this.reason,
			offenderId: this.offenderId,
			serverId: this.serverId,
		};

		// Insert or update the report in the database
		this.id = await this.db.set('reports', reportData, this.id); // Assuming `this.db.set` will return the ID after insertion/update

		return this.id;
	}


	/**
	 * Converts the report to JSON for saving or further processing.
	 * @returns {Object} JSON representation of the report
	 */
	toJson() {
		return {
			id: this.id,
			type: this.type,
			reason: this.reason,
			senderId: this.senderId,
			offenderId: this.offenderId,
			serverId: this.serverId,
			offender: this.offender ? this.offender.toJson() : null,
		};
	}
}

module.exports = Report;
