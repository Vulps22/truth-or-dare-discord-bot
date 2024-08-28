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
					'- `terms` - View the Terms of Use this server has agreed to follow.\n\t\tUse `/report server` if this server has broken those Terms\n' +
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
			.setTitle("Terms Accepted")
			.setDescription("We hope you enjoy playing Truth or Dare with our massive global database of dares! 🙂");
	},
	v5() {
		return new EmbedBuilder()
			.setTitle('🎉 Introducing Version 5.0.0 of Truth Or Dare Online 18+ 🎉')
			.setDescription('Hello amazing users! I\'m beyond excited to share this massive update with you. From just a few bored and horny strangers, to 1400 servers—what a journey it\'s been! 🌟')
			.setColor(10181046)
			.addFields(
				{
					name: 'A Personal Thank You',
					value: 'Starting this was all about creating something fun for communities I cared about. Now, seeing it grow to this scale is unbelievable. I can\'t thank you enough for installing, playing, and sharing this bot with me!'
				},
				{
					name: 'Major Changes & Why They Matter',
					value: '🔹 **Announcements Feature** - For only the most crucial updates and notifications, keeping spam minimal.\n🔹 **Overhauled Truths & Dares** - With community voting to ensure everyone\'s held accountable, making the game more engaging.'
				},
				{
					name: 'Competition & Community',
					value: '🔹 **New Leaderboards & Ranks** - See top players worldwide or check your status with `/leaderboard` and `/rank`.\n🔹 **Proof of Dare** - The new voting system offers incentive to actually _do_ the dares ;)'
				},
				{
					name: 'Simplified Interactions',
					value: '🔹 **Improved Setup Process** - More intuitive with buttons and dropdowns, making it easier than ever to get started.\n🔹 **Streamlined Commands** - No more clunky `/accept-terms`, just smooth sailing.'
				},
				{
					name: 'Future-Proofing with Premium',
					value: 'Due to the astounding popularity of the bot, Some of the new features are now paywalled behind a premium subscription. Rest assured, all previous features remain free!\n Every subscription helps make this bot better. It tells me I\'m doing something you enjoy! It tells me I should work harder to give you _even more_ features, games and improvements! :D (and it would let me pay the moderators who really do a ton of work behind the scenes)'
				},
				{
					name: 'New Premium Features',
					value: '🔹 **Server-Specific Leaderboards and Levels** - Unique to each premium server.\n🔹 **Role Assignments by Level** - Automatic role updates as you level up in the server.'
				},
				{
					name: 'Admin Tools and Server Customization',
					value: '🔹 **Custom XP Values** - Server admins can now set XP values for activities to fine-tune the game balance.\n🔹 **Server-Only Truth/Dare Pools** - Premium servers can have their own Truth/Dare content, independent of the global pool.'
				},
				{
					name: 'Operation Moderation!',
					value: 'The day before we released v5.0.0, the moderators and I undertook the immense task of re-moderating the _entire_ database. We banned and reviewed EVERY SINGLE Truth/Dare in the database. No more \'Giver Dares\' or strange-ass truths asking which parent you\'d rather fuck (you know who you are! 🤣).\nFrom now on, every global truth or dare must be approved or banned by a moderator before anybody sees it :)'
				},
				{
					name: 'Quality of Life Improvements',
					value: 'We\'ve not only moderated existing truths and dares but also introduced a host of interface and usability enhancements. And there’s more on the way!'
				},
				{
					name: 'Let\'s Make It Better Together!',
					value: 'Your feedback is invaluable. If you have ideas or suggestions, please share them in our official server. Your input directly influences future updates!'
				}
			)
			.setFooter({ text: 'Looking forward to hearing your thoughts and seeing how you enjoy the new features! Stay tuned for v5.1.0 with full premium launch!' });
	},
	vote() {
		return new EmbedBuilder()
			.setTitle("Upvote the bot for special privileges")
			.setDescription("[You can vote for Truth Or Dare Online 18+ here](https://top.gg/bot/1079207025315164331/vote).\n\nVoting helps the bot raise higher in the search results on top.gg, and encourages more servers to install the bot :)\nmore servers = more dares!")
			.addFields(
				{
					name: "Earn Skips for every vote!",
					value: "- Skips allow you to ignore a dare without having a negative effect on your ranking or level!\n- You can have 10 skips stored up\n- Every vote gives you another skip you can use\n- Voting on a weekend gives you 2 skips!!"
				},
				{
					name: "More to come!",
					value: "We're just getting started on Votes!\nOver time we're going to add more and more benefits for every vote to really enhance your time using the bot :D"
				}
			)
			.setFooter({ text: "Thank you for voting :)" });
	}
}