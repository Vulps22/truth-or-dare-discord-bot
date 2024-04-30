const { Events, Guild } = require("discord.js")
const Server = require("../objects/server");
const logger = require("../objects/logger");

module.exports = {
	name: Events.GuildCreate,
	/**
	 * 
	 * @param {Guild} server 
	 */
	async execute(server) {
		
		const newServer = new Server(server.id);
		await newServer.load();
		if(!newServer._loaded){
			newServer.name = server.name;
			await newServer.save();
			await newServer.load();
		}
		console.log("Got here!")
		await logger.newServer(newServer);
	}
}