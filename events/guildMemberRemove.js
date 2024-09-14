const { Events, GuildMember } = require("discord.js");
const User = require("../objects/user");
const Database = require("../objects/database");
const logger = require("../objects/logger");

module.exports = {
	name: Events.GuildMemberRemove,
	/**
	 * 
	 * @param {GuildMember} member 
	 */
	async execute(member) {
		
		const user = new User(member.id);
		await user.load();
		if(!user._loaded) {
			return;
		}
		await user.loadServerUser(member.guild.id);
		if(!user._serverUserLoaded) return;
		
		user.deleteServerUser(member.guild.id);

		logger.log(`Removing User ${member.id} from ${member.guild.id}`);
	}
}