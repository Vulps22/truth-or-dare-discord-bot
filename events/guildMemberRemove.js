const { Events } = require("discord.js");
const User = require("../objects/user");
const Database = require("../objects/database");
const logger = require("../objects/logger");

module.exports = {
	name: Events.GuildMemberRemove,
	async execute(member) {
		const db = new Database();
		
        db.query(`DELETE FROM server_users WHERE user_id = ${member.id} AND server_id = ${member.guild.id}`);
		logger.log(`Removing User ${member.id} from ${member.guild.id}`);
	}
}