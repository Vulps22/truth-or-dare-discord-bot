const { Events, Guild } = require("discord.js")
const Server = require("objects/server");
const logger = require("objects/logger");

module.exports = {
	name: Events.GuildCreate,
	/**
	 * 
	 * @param {Guild} server 
	 */
	async execute(server) {
		logger.log("Registering a new Server: " + server.name + "With ID: " + server.id);
		const newServer = new Server(server.id);
		await newServer.load();
		if(!newServer._loaded){
			newServer.name = server.name;
			newServer.owner = server.ownerId;
			newServer.save();
		}
		await logger.newServer(newServer);
	}
}