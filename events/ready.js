require('dotenv').config();
const { Events } = require('discord.js');
const ChannelManager = require('channelManager');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		//new ChannelManager(client).update();

	}
}