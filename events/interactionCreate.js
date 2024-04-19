const { Events, WebhookClient } = require("discord.js");
const UserHandler = require("../handlers/userHandler");
const Database = require("../objects/database");
const DareHandler = require("../handlers/dareHandler");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isAutocomplete()) {
			handleAutoComplete(interaction);
			return;
		}

		//handle button presses
		if (interaction.isButton()) {
			handleButton(interaction);
		}

		let user;
		try {
			user = await new UserHandler().getUser(interaction.user.id, interaction.user.username);
		} catch (error) {
			console.error('Error getting user:', error);
			// Handle the error appropriately, e.g., by sending a message to the user or logging the error
			return;
		}
		
		if (!user) {
			const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_FARTS_URL });
			webhookClient.send(`**Failed to create User during InteractionCreate** | **server**: ${interaction.guild.name}`);
		}

		if (interaction.isChatInputCommand()) {
			log(interaction);
			if (!hasPermission(interaction)) return;
			await runCommand(interaction);
		}

	},
};


async function handleAutoComplete(interaction) {

	// Handle autocomplete interaction
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		if (command.autocomplete) {
			await command.autocomplete(interaction);
		}
	} catch (error) {
		console.error(`Error executing autocomplete for ${interaction.commandName}`);
		console.error(error);
	}
}

async function handleButton(interaction) {
	let buttonId = interaction.customId;
	//split the id by the _ to get the command name
	let commandName = buttonId.split('_')[0];
	switch (commandName) {
		case "dare":
			await new DareHandler(interaction.client).vote(interaction);
			break;
		case "truth":
			interaction.reply("Truth Voting is not yet available. Please check back later");
			break;
	}
}

function log(interaction) {


	if (interaction.guild === null) {
		const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_FARTS_URL });
		webhookClient.send(`**Null Server**: ${interaction.commandName} | **server**: INTERACTION.GUILD WAS NULL OR UNDEFINED`);
	}

	let guildName = interaction.guild.name;
	const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_COMMAND_URL });
	webhookClient.send(`**Command**: ${interaction.commandName} | **server**: ${guildName ? guildName : "UNKNOWN SERVER NAME"}`);
}

function hasPermission(interaction) {
	const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_COMMAND_URL });

	const botPermissions = interaction.guild.members.me.permissionsIn(interaction.channel);

	//The bot can respond with interaction.reply without these permissions
	if (!botPermissions.has('ViewChannel')) {
		interaction.reply('I do not have permission to view this channel. I require permission to `view channel` to function correctly');
		webhookClient.send(`Interaction Failed: No Permissions`);
		return;
	}
	//embeds are messages NOT bot responses
	if (!botPermissions.has('SendMessages')) {
		interaction.reply('I do not have permission to send messages in this channel. I require permission to `send messages` and `embed links` to function correctly');
		webhookClient.send(`Interaction Failed: No Permissions`);
		return;
	}

	//embeds require this permission to be accepted by discord
	if (!botPermissions.has('EmbedLinks')) {
		interaction.reply('I do not have permission to embed links in this channel. I require permission to `send messages` and `embed links` to function correctly');
		webhookClient.send(`Interaction Failed: No Permissions`);
		return;
	}
	return true;
}

async function runCommand(interaction) {
	try {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(
				`No command matching ${interaction.commandName} was found.`
			);
			return;
		}

		const key = interaction.guildId
		let guild = await new UserHandler().findGuild(key)
		if (!guild) {
			db = new Database();
			guild = { id: interaction.guildId, name: interaction.guild.name, hasAccepted: 0, isBanned: 0 }
			await db.set('guilds', guild);
		}

		if (guild.isBanned && interaction.commandName !== "help") {
			interaction.reply('Your Community has been banned for violating the bot\'s Terms of Use');
			const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_COMMAND_URL });
			webhookClient.send(`Command Aborted: **Banned** | **server**: ${interaction.guild.name}`);

			return;
		}

		if (shouldExecute(interaction, guild)) await command.execute(interaction);
	} catch (error) {
		console.error(`Error executing ${interaction.commandName}`);
		console.error(error);
		interaction.reply("Woops! Brain Fart! Try another Command while I work out what went Wrong :thinking:")
		const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_FARTS_URL });

		webhookClient.send(`New Brain Fart occurred!\nCommand: ${interaction.commandName}\nError: ${error.message}`);
	}
}


function shouldExecute(interaction, guild) {
	if ((!guild || !guild.hasAccepted) && !(interaction.commandName === "setup" || interaction.commandName === "accept-terms" || interaction.commandName === "help")) {
		interaction.reply("A community Administrator must first run the /setup command before you can use me");
		return;
	}
	if (!(interaction.commandName === "setup" || interaction.commandName === "accept-terms")) { //only run checks for non setup commands
		if (interaction.commandName !== "help") {
			if (!interaction.channel.nsfw) {
				interaction.reply("My commands can only be used on channels marked as NSFW (`Age Restricted`)\nFor more information use `/help`")
				return;
			}
		}
		if (guild && (guild.name === undefined || guild.name === null)) {
			guild.name = interaction.guild.name; //set the name if it's null
		}
		db = new Database();
		db.set('guilds', guild); //We always update the guild so that we can see servers that have been inactive
		return true;
	} else return true; //Without this, we block setup and accept-terms
}