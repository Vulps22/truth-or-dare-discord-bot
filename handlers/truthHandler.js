const Handler = require('handlers/handler.js')

class TruthHandler extends Handler {

	successXp = 40;
	failXp = 40;

	constructor(client) {
		super("truth")
		this.client = client
	}
}

module.exports = TruthHandler;