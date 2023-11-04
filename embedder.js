const { EmbedBuilder, Embed } = require('discord.js');
module.exports = {
	help(setup = false) {
		let embed = new EmbedBuilder()
			.setTitle('Truth or Dare Bot Help')
			.setDescription('Here are the commands you can use with the bot:');

		if (setup) embed.addFields(
			{ name: 'Getting Started', value: "You must first read and accept our Terms of Use before using the bot" },
			{
				name: ' ', value:
					'- `/setup` - Register your server on our database and view the Bot\'s Terms of Use\n' +
					'- `/accept-terms` - Accept our Terms of Use and unlock all the commands'
			},
			{ name: ' ', value: ' ' },

		)

		embed.addFields(
			{
				name: '**Basic Commands**',
				value:
					'- `/truth` - Get random truth\n' +
					'- `/dare` - Get random dare\n' +
					'- `/random` - Get random truth or dare'
			},
			{
				name: '**Create Commands**',
				value:
					'- `/create dare` - Add dare to pool\n' +
					'- `/create truth` - Add truth to pool'
			},
			{
				name: '**Challenge Commands**',
				value:
					'- `/give dare` - Challenge someone to a dare\n' +
					'- `/give truth` - Challenge someone to a truth'
			},
			{
				name: '**Report Commands**',
				value:
					'- `/report dare` - Report inappropriate dare\n' +
					'- `/report truth` - Report inappropriate truth\n' +
					'- `/report server` - Report rule-breaking server'
			},
			{
				name: '**Utility Commands**',
				value:
					'- `/vote` - See a list of Bot lists where you can vote to support our bot and help it grow faster!\n' +
					'- `terms` - View the Terms of Use this server has agreed to follow.\n\t\tUse `/report guild` if this server has broken those Terms\n' +
					'- `/help` - See a list of available commands\n\n'
			}
		)

		if (!setup) embed.addFields(
			{ name: 'Creating Truths or Dares', value: "Everybody worldwide is welcome to create as many truths or dares as they can imagine. In fact it is encouraged! \nThe more we all create, the more variety when we play 😁" },
			{ name: ' ', value: '\n\n' },
		);
		embed.addFields(
			{ name: 'Links', value: ' ' },
			{ name: 'For news, updates and help', value: ` [Join Our Support Server](https://discord.gg/${process.env.DISCORD_INVITE_CODE})`, inline: true },
			{ name: 'Got your own community?', value: `[Add The Bot](${process.env.BOT_INVITE_URL})\n\n`, inline: true },
		)
		return embed;
	},
	terms() {
		return new EmbedBuilder()
			.setTitle("Accept these Terms and Conditions to proceed")
			.setDescription("Type /accept-terms to accept these terms and grant access to the bot")
			.addFields([
				{ name: "1. Acknowledgment", value: "You the Administrator of this server acknowledge and understand that Truth or Dare Online is an adult game with adult content not intended for anybody under 18." },
				{ name: "2. Precautions for Under 18s", value: "You agree that you will take every reasonable precaution to prevent children under the age of 18 from viewing any channels this bot is used in." },
				{ name: "3. Reporting", value: "You understand that any user can report your server for allowing under 18's to use or view content generated by this bot or its users." },
				{ name: "4. Investigation", value: "You agree that if such a report is submitted, a member of the bot's moderation team may investigate your server." },
				{ name: "5. Consequences", value: "You understand that your server could be banned from using the bot and reported for breaching Discord's ToS if a member of the moderation team finds you to be breaching these terms, Discord ToS, or the law." },
				{ name: "6. Data", value: "You agree to allow the bot to store some basic information about the community for moderation purposes: Your community ID number, and your community's name." },
			])
			.addFields(
				{ name: 'Links', value: ' ' },
				{ name: 'For updates and help', value: ` [Join Our Support Server](https://discord.gg/${process.env.DISCORD_INVITE_CODE})`, inline: true },
				{ name: 'Got your own community?', value: `[Add The Bot](${process.env.BOT_INVITE_URL})\n\n`, inline: true },
			)
	},
	accepted() {
		//"Setup complete. You can now use /dare or /truth"
		return new EmbedBuilder()
			.setTitle("Accept these Terms and Conditions to proceed")
			.setDescription("Type /accept-terms to accept these terms and grant access to the bot\nThank you for choosing Truth or Dare Online 18+")
	},
	vote() {
		return new EmbedBuilder()
			.setTitle('Vote for the Bot')
			.setDescription('More servers means more users, which means more dares 😈\nMore votes means more servers 😉')
			.addFields([
				{ name: 'Top.gg', value: '- [Vote on Top.gg](https://top.gg/bot/1079207025315164331)' },
				{ name: 'Discord Bot List', value: '- [Vote on Discord Bot List](https://discordbotlist.com/bots/truth-or-dare-online-18)' },
				{ name: ' ', value: ' ' },
				{ name: 'Rewards', value: 'We are in active discussion on which new features we could add as rewards for voting for the Bot.\nIf you have any suggestions, Come share them on our Support Server\n\n' },
			])
			.addFields(
				{ name: 'Links', value: ' ' },
				{ name: 'For updates and help', value: ` [Join Our Support Server](https://discord.gg/${process.env.DISCORD_INVITE_CODE})`, inline: true },
				{ name: 'Got your own community?', value: `[Add The Bot](${process.env.BOT_INVITE_URL})\n\n`, inline: true },
			)
	}	
}