require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, GatewayIntentBits, Collection, WebhookClient } = require('discord.js');
const Database = require('./objects/database.js'); //import Database class
const DareHandler = require('./handlers/dareHandler.js'); // import DareHandler
const TruthHandler = require('./handlers/truthHandler.js'); // import TruthHandler
const UserHandler = require('./handlers/userHandler.js'); // import TruthHandler
const logger = require('./objects/logger.js'); // import Logger
const Question = require('./objects/question.js');
const { exit } = require('node:process');

console.log('Initialising Bot....');

const ALPHA = process.env['ALPHA'] ?? false;

console.log("Starting in ", ALPHA ? "ALPHA Mode" : "PRODUCTION Mode");

const TOKEN = ALPHA ? process.env['aTOKEN'] : process.env['TOKEN']
const CLIENT_ID = ALPHA ? process.env['aCLIENT_ID'] : process.env['CLIENT_ID']
const GUILD_ID = process.env['GUILD_ID']
/*
process.on('uncaughtException', (err, origin) => {

	const message = `${process.env.ALPHA ? '[ALPHA]' : ''} UNHANDLED EXCEPTION CAUGHT AT SURFACE LEVEL\n- ${err}\n- ${origin}`;

	console.log(message);
	console.log('Stack: ', err.stack);

	logger.error(message);
});

*/
global.client = new Client({ intents: [GatewayIntentBits.Guilds] });

const db = new Database()
db.list("dares").then((dares) => {
	db.list("truths").then((truths) => {
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


//load the commands
client.commands = new Collection();

const commandsPathG = path.join(__dirname, "commands/global");
const commandFilesG = fs.readdirSync(commandsPathG)
	.filter((file) => file.endsWith('.js'));

for (const file of commandFilesG) {
	const filePath = path.join(commandsPathG, file);
	const command = require(filePath);
	if (command.data && command.execute) {
		client.commands.set(command.data.name, command)
	} else {
		console.warn(`[WARNING] The command at ${filePath} is missing a required 'data or 'execute property`)
	}
}

const commandsPathM = path.join(__dirname, "commands/mod");
const commandFilesM = fs.readdirSync(commandsPathM)
	.filter((file) => file.endsWith('.js'));

for (const file of commandFilesM) {
	const filePath = path.join(commandsPathM, file);
	const command = require(filePath);
	if (command.data && command.execute) {
		client.commands.set(command.data.name, command)
	} else {
		console.warn(`[WARNING] The command at ${filePath} is missing a required 'data or 'execute property`)
	}
}

client.login(TOKEN);