const { EmbedBuilder, Embed } = require('discord.js');
module.exports = {
	help(isSetup = true) {
		let embed = new EmbedBuilder()
			.setTitle('Truth or Dare Bot Help')
			.setDescription('Here are the commands you can use with the bot:');

		if (!isSetup) embed.addFields(
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
					'- `/give truth` - Challenge someone to a truth\n' + 
					'- `NEW` Incentivise targeted player by wagering your own XP'
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
					'- `/terms` - View the Terms of Use this server has agreed to follow.\n\t\tUse `/report server` if this server has broken those Terms\n' +
					'- `/help` - See a list of available commands\n\n'
			}
		)

		if (isSetup) embed.addFields(
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
				{ name: 'For updates and help', value: ` [Join Our Support Server](https://discord.gg/${my.discord_invite_code})`, inline: true },
				{ name: 'Got your own community?', value: `[Add The Bot](${my.bot_invite_url})\n\n`, inline: true },
			)
	},
	rules() {
        const embed = new EmbedBuilder()
            .setTitle('Avoiding Bans')
            .setDescription('Here are some tips to avoid your truths/dares being banned:')
            .addFields(
				{name: 'Your submissions are ***global***', value: "- We moderate and approve/ban every submission.\n- Everything you submit with /create that gets approved could show up on any server.\n\n These rules are the guidance we use to decide whether to approve or ban your submissions"},
                { name: 'No Dangerous Or Illegal Content', value: '- Keep it safe and legal' },
                { name: 'No Targeting Specific People', value: '- Truths/dares are global and should work for everyone' },
                { name: 'No Mentions Of "The Giver"', value: '- Use /give for those types of dares' },
                { name: 'Follow Discord Guidelines', value: '- No Racism, Underage references etc.' },
                { name: 'Use English', value: '- For bot language support' },
                { name: 'No Nonsense Content', value: '- Avoid keyboard smashing, single letters etc' },
                { name: 'No Childish Content', value: '- Could be written by a child/teen, or likely to be ignored' },
                { name: 'No Shoutouts', value: '- Using names, "I am awesome!"' },
                { name: 'No Dares That Require More Than One Person', value: '- This is an **online** bot!' },
                { name: 'Check Spelling And Grammar', value: '- Low-Effort content will not be accepted' },
                { name: '\n', value: '\n' },
                { name: 'Important Notes', value: '- **You could be banned from using the bot** if we have to repeatedly ban your dares!\n- This is not a limit to the reasons why we may ban your submissions.\n- Moderators reserve the right to ban your submissions for any reason they deem appropriate.\n- You are free to appeal any ban if you feel it is unjust or unfair.' },
            );
        return embed;
    },
	accepted() {
		//"Setup complete. You can now use /dare or /truth"
		return new EmbedBuilder()
			.setTitle("Terms Accepted")
			.setDescription("We hope you enjoy playing Truth or Dare with our massive global database of dares! 🙂");
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