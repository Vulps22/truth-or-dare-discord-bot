const { Events } = require("discord.js");
const User = require("../objects/user");

module.exports = {
	name: Events.GuildMemberAdd,
	async execute(member) {
		const db = new Database();
		
        let user = new User(member.id, member.username);
        await user.get();
        await user.loadServerUser(member.guild.id);
	}
}