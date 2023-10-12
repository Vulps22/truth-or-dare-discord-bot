const { Events, WebhookClient } = require("discord.js");
const UserHandler = require("../userHandler");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;
		try {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(
					`No command matching ${interaction.commandName} was found.`
				);
				return;
			}

			const key = interaction.guildId
			const guild = await new UserHandler().findGuild(key)

			if ((!guild || !guild.hasAccepted) && !(interaction.commandName === "setup" || interaction.commandName === "accept-terms" || interaction.commandName === "help")) {
				interaction.reply("A community Administrator must first run the /setup command before you can use me");
				return;
			}
			if (!(interaction.commandName === "setup" || interaction.commandName === "accept-terms")) { //only run checks for non setup commands
				if (interaction.commandName !== "help") {
					if (guild.isBanned) {
						interaction.reply('Your Community has been banned for violating the bot\'s Terms of Use');
						return;
					}

					if (!interaction.channel.nsfw) {
						interaction.reply("My commands can only be used on channels marked as NSFW")
						return;
					}
				}
				if (guild && (guild.name === undefined || guild.name === null)) {
					guild.name = interaction.guild.name;
					db.set('guilds', guild).then(() => {
						console.log(
							"Server updated with name"
						)
					})
				}
			}



			await command.execute(interaction);
		} catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);
			interaction.reply("Woops! Brain Fart! Try another Command while I work out what went Wrong :thinking:")
			const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_FARTS_URL });

			webhookClient.send(`New Brain Fart occurred!\nCommand: ${interaction.commandName}\nError: ${error.message}`);
		}
	},
};
