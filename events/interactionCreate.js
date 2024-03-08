const { Events, WebhookClient } = require("discord.js");
const UserHandler = require("../userHandler");
const Database = require("../database");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {

		if (interaction.isAutocomplete()) {
			handleAutoComplete(interaction);
			return;
		}

		if (interaction.isChatInputCommand()){
			log(interaction);
			if(!hasPermission(interaction)) return;
			console.log("Call RunCommand");
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

function log(interaction) {

	let guildName = interaction.guild.name ?? null;

	const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_COMMAND_URL });
	webhookClient.send(`**Command**: ${interaction.commandName} | **server**: ${guildName ? guildName : "UNKNOWN SERVER NAME"}`);
}

function hasPermission(interaction) {
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

		console.log("Permission granted");
		return true;
}

async function runCommand(interaction) {
	console.log("run!");
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

		console.log(guild);

		if(!guild) {
			db = new Database();
			guild = { id: interaction.guildId, name: interaction.guild.name, hasAccepted: 0, isBanned: 0 }
			//await db.set('guilds', guild);
		}

		if (guild.isBanned && interaction.commandName !== "help") {
			interaction.reply('Your Community has been banned for violating the bot\'s Terms of Use');
			const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_COMMAND_URL });
			webhookClient.send(`Command Aborted: **Banned** | **server**: ${interaction.guild.name}`);

			return;
		}

		if(shouldExecute(interaction, guild)) await command.execute(interaction);
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
		console.log("Command should Execute");
		return true;
	}else return true; //Without this, we block setup and accept-terms
}