const { Events } = require("discord.js");
const User = require("../objects/user");

module.exports = {
	name: Events.GuildMemberAdd,
	async execute(member) {
		const db = new Database();

		let user = new User(member.id, member.username);
		await user.load();
		if (user._loaded) { //we do not want to create new users just for joining a server. Always wait till they interact with the bot first
			await user.loadServerUser(member.guild.id);
			user.save()
		}

	}
}