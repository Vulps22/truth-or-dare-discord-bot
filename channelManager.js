const Database = require("objects/database");

module.exports = class ChannelManager {

	constructor(client) {
		if (!client) return;
		this.client = client;
	}

	update(type = null) {
		if (my.environment === 'dev' || my.environment === 'stage') {
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
		if (my.environment == 'dev') {
			console.log("ALPHA MODE: Skipping Channel Update")
			return;
		}		// Get the status channel
		const statusChannel = this.client.channels.cache.get(process.env.STATUS_CHANNEL_ID);

		// Update channel name with guild count
		statusChannel.setName(`Connected Servers: ${this.client.guilds.cache.size}`);

		console.log(`Connected Servers: ${this.client.guilds.cache.size}`);
	}

	/**
	 * 
	 * @returns 
	 */
	updateDareCount() {
		if (my.environment == 'dev') {
			console.log("ALPHA MODE: Skipping Channel Update")
			return;
		}		// Get the status channel
		const statusChannel = this.client.channels.cache.get(my.status_dares);
		new Database().list('questions').then((dares) => {
			const nonBannedDares = dares.filter(dare => !dare.isBanned && dare.type == 'dare');

			const count = nonBannedDares.length;

			statusChannel.setName(`Total Dares: ${count}`);

			console.log('Total Dares:', count);
		})

	}

	updateTruthCount() {
		if (my.environment == 'dev') {
			console.log("ALPHA MODE: Skipping Channel Update")
			return;
		}
		// Get the status channel
		const statusChannel = this.client.channels.cache.get(process.env.TRUTH_CHANNEL_ID);
		new Database().list('questions').then((truths) => {
			const nonBannedTruths = truths.filter(truth => !truth.isBanned && truth.type == 'truth');

			const count = nonBannedTruths.length;

			statusChannel.setName(`Total Truths: ${count}`);

			console.log('Total Truths:', count);
		})

	}


}

