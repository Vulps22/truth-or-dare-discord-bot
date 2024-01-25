const { Events, WebhookClient, PermissionsBitField } = require("discord.js");
const UserHandler = require("../userHandler");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_COMMAND_URL });
		webhookClient.send(`**Command**: ${interaction.commandName} | **server**: ${interaction.guild.name}`);
		// Check permissions

		const botPermissions = interaction.guild.members.me.permissionsIn(interaction.channel);

		
		if (!botPermissions.has('SendMessages')) {
			interaction.reply('I do not have permission to send messages in this channel. I require permission to `send messages` and `embed links` to function correctly');
			webhookClient.send(`Interaction Failed: No Permissions`);
			return;
		}

		if (!botPermissions.has('EmbedLinks')) {
			interaction.reply('I do not have permission to embed links in this channel. I require permission to `send messages` and `embed links` to function correctly');
			webhookClient.send(`Interaction Failed: No Permissions`);
			return;
		}
		
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
						const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_COMMAND_URL });
						webhookClient.send(`Command Aborted: **Banned** | **server**: ${interaction.guild.name}`);

						return;
					}

					if (!interaction.channel.nsfw) {
						interaction.reply("My commands can only be used on channels marked as NSFW (`Age Restricted`)\nFor more information use `/help`")
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
