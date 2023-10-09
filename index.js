require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { modCommands } = require('./command.js');
const keep_alive = require('./keep_alive.js');
const { Client, GatewayIntentBits, PermissionsBitField, Collection } = require('discord.js');
const Database = require('./database.js'); //import Database class
const DareHandler = require('./dareHandler.js'); // import DareHandler
const TruthHandler = require('./truthHandler.js'); // import TruthHandler
const UserHandler = require('./userHandler.js'); // import TruthHandler
const Question = require('./question.js');

const TOKEN = process.env['TOKEN']
const CLIENT_ID = process.env['CLIENT_ID']
const GUILD_ID = process.env['GUILD_ID']

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const db = new Database()
db.list("dares").then((dares) => {
	db.list("truths").then((truths) => {
		console.log({ 'dares': dares, 'truths': truths });
		console.log("loaded: ", dares.length + truths.length)
	})
})


//load the event files

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath)
	.filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.commands = new Collection();

const commandsPathG = path.join(__dirname, "commands/global");
const commandFilesG = fs.readdirSync(commandsPathG)
	.filter((file) => file.endsWith('.js'));

for (const file of commandFilesG) {
	const filePath = path.join(commandsPathG, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command)
	} else {
		console.warn(`[WARNING] The command at ${filePath} is missing a required 'data or 'execute property`)
	}
}

client.login(TOKEN);
/*
	} catch (error) {
		console.error(error);
		interaction.reply({
			content: 'Woops! Brain Fart! Try another command while I work out what went wrong :thinking:',
			ephemeral: true
		});
	}
});

function randomSelection(interaction) {
	const random = Math.floor(Math.random() * 2);
	if (random == 1) new DareHandler(client).dare(interaction);
	else new TruthHandler(client).truth(interaction);
}

function updateCommands(interaction = null) {
	const rest = new REST({ version: '9' }).setToken(TOKEN);

	(async () => {
		try {
			console.log('Started refreshing application (/) commands.');

			await rest.put(
				Routes.applicationCommands(CLIENT_ID),
				{ body: globalCommands },
			);

			console.log("Global Commands Updated")
			await rest.put(
				Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
				{ body: modCommands },
			);
			console.log("Moderator Commands Updated")

			console.log('Successfully reloaded application (/) commands.');
			if (interaction !== null) interaction.reply("Successfully reloaded application (/) commands.")
		} catch (error) {
			console.error(error);
			console.log("Command update Failed with Error")
			if (interaction !== null) interaction.reply("Command update failed with an error. Check console log for details...")
		}
	})();
}

client.login(process.env['TOKEN']);
*/