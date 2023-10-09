const { Events } = require("discord.js");
const UserHandler = require("../userHandler");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(
				`No command matching ${interaction.commandName} was found.`
			);
			return;
		}

		if (!interaction.channel.nsfw) {
			interaction.reply("My commands can only be used on channels marked as NSFW")
			return;
		}

		const key = interaction.guildId
		const guild = await new UserHandler().findGuild(key)
		console.log(guild)
		if ((!guild || !guild.hasAccepted) && !(interaction.commandName === "setup" || interaction.commandName === "accept-terms")) {
			interaction.reply("A community Administrator must first run the /setup command before you can use me");
			return;
		}

		if (guild && (guild.name === undefined || guild.name === null)) {
			guild.name = interaction.guild.name;
			db.set('guilds', guild).then(() => {
				console.log(
					"Server updated with name"
				)
			})
		}


		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);
			interaction.reply("Woops! Brain Fart! Try another Command while I work out what went Wrong :thinking:")
		}
	},
};
