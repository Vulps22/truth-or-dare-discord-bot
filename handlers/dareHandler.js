const Handler = require('handlers/handler.js')

class DareHandler extends Handler {

	successXp = 50;
	failXp = 25; //this is subtracted from the user's xp when they fail a dare

	constructor(client) {
		super("dare")
		this.client = client
	}
}

module.exports = DareHandler;