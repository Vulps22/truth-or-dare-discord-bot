require('dotenv').config();
const Database = require("./database");
const { updateServerCount } = require("./userHandler");

module.exports = class ChannelManager {

	constructor(client) {
		if (!client) return;
		this.client = client;
	}

	update(type = null) {
		if (process.env.ALPHA) {
			console.log("ALPHA MODE: Skipping Channel Update")
			return;
		}
		switch (type) {
			case 'server':
				this.updateServerCount();
				break;
			case 'dare':
				this.updateDareCount();
				break;
			case 'truth':
				this.updateTruthCount();
				break;
			default:
				this.updateServerCount();
				this.updateTruthCount();
				this.updateDareCount();
		}
	}

	updateServerCount() {
		if (process.env.ALPHA) {
			console.log("ALPHA MODE: Skipping Channel Update")
			return;
		}		// Get the status channel
		const statusChannel = this.client.channels.cache.get(process.env.STATUS_CHANNEL_ID);

		// Update channel name with guild count
		statusChannel.setName(`Connected Servers: ${this.client.guilds.cache.size}`);

		console.log(`Connected Servers: ${this.client.guilds.cache.size}`);
	}

	updateDareCount() {
		if (process.env.ALPHA) {
			console.log("ALPHA MODE: Skipping Channel Update")
			return;
		}		// Get the status channel
		const statusChannel = this.client.channels.cache.get(process.env.DARE_CHANNEL_ID);
		new Database().list('dares').then((dares) => {
			const nonBannedDares = dares.filter(dare => !dare.isBanned);

			const count = nonBannedDares.length;

			statusChannel.setName(`Total Dares: ${count}`);

			console.log('Total Dares:', count);
		})



	}

	updateTruthCount() {
		if (process.env.ALPHA) {
			console.log("ALPHA MODE: Skipping Channel Update")
			return;
		}
		// Get the status channel
		const statusChannel = this.client.channels.cache.get(process.env.TRUTH_CHANNEL_ID);
		new Database().list('truths').then((truths) => {
			const count = truths.length

			statusChannel.setName(`Total Truths: ${count}`);

			console.log('Total Truths:', count);
		})



	}


}

