require('dotenv').config();
const { Events } = require('discord.js');
const UserHandler = require('../userHandler');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		UserHandler.updateServerCount(client);

	}
}