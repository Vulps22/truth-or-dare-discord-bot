const { EmbedBuilder, Embed } = require('discord.js');

const Handler = require('./handler.js')
const Question = require('./question.js');
const Database = require('./database.js');

class UserHandler extends Handler {

	db;

	constructor() {
		super();
		this.db = new Database();
	}

	async findGuild(id) {
		if (!id) return;
	console.log("find guild", id);
		return this.db.get('guilds', id)
		  .then(guild => {
			return guild;  
		  });
	  }

	startSetup(interaction) {

		const embed = new EmbedBuilder()
			.setTitle("Accept these Terms and Conditions to proceed")
			.setDescription("Type /accept-terms to accept these terms and grant access to the bot")
			.addFields([
				{ name: "1. Acknowledgment", value: "You the Administrator of this server acknowledge and understand that Truth or Dare Online is an adult game with adult content not intended for anybody under 18." },
				{ name: "2. Precautions for Under 18s", value: "You agree that you will take every reasonable precaution to prevent children under the age of 18 from viewing any channels this bot is used in." },
				{ name: "3. Reporting", value: "You understand that any user can report your server for allowing under 18's to use or view content generated by this bot or its users." },
				{ name: "4. Investigation", value: "You agree that if such a report is submitted, a member of the bot's moderation team may investigate your server." },
				{ name: "5. Consequences", value: "You understand that your server could be banned from using the bot and reported for breaching Discord's ToS if a member of the moderation team finds you to be breaching these terms, Discord ToS, or the law." },
				{ name: "6. Data", value: "You agree to allow the bot to store some basic information about the community for moderation purposes: Your community ID number, and your community's name." }
			])

		const guild = this.findGuild(interaction.guildId).then((data) => {
			console.log("found:", data)
			if (!data) this.db.set('guilds', { id: interaction.guildId, name: interaction.guild.name, hasAccepted: false, isBanned: false }).then(() => {
				interaction.reply({ embeds: [embed] });
			})
		})

	}

	async acceptSetup(interaction) {

		const guild = await this.findGuild(interaction.guildId).then((data) => {
			if (!data) {
				interaction.reply("You must first use /setup and read the Terms of Use");
				return;
			}
			let g = data;
			console.log(g);
			g.id = interaction.guildId;
			g.hasAccepted = 1;
			this.db.set('guilds', g);
			interaction.reply("Setup complete. You can now use /dare or /truth");
		})
	}
}

module.exports = UserHandler