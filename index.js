require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection, SlashCommandRoleOption } = require('discord.js');
const Database = require('./objects/database.js'); // Import Database class
const express = require('express');
const User = require('./objects/user.js');
const logger = require('./objects/logger.js');

console.log('Initialising Bot....');

/**
 * @typedef {Object} Config
 * @property {boolean} maintenance_mode - Indicates if the bot is in maintenance mode.
 * @property {string|null} token - The bot's token.
 * @property {string} dares_log - The channel ID for dares logging.
 * @property {string} truths_log - The channel ID for truths logging.
 * @property {string} servers_log - The channel ID for servers logging.
 * @property {number} required_votes - Number of votes required.
 * @property {string} environment - Indicates the environment ('stage', 'prod', etc.).
 * @property {string} top_gg_webhook_secret - The secret used when interacting with top.gg
 */

/** @type {Config} */
global.my = {
    maintenance_mode: false,
    token: null,
    dares_log: '1160740531094159492',
    truths_log: '1160740531094159492',
    servers_log: '1160740531094159492',
    required_votes: 3,
    environment: 'stage'
};

process.on('uncaughtException', (err, origin) => {
    console.error(err);
    console.error(origin);
 });


global.client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();


async function main() {
    const db = new Database();
    try {
        const data = await db.get('config', 1);
        global.my = data;
        console.log(my);
    } catch (error) {
        console.error('Error loading config from database:', error);
        return;  // Exit if configuration loading fails
    }

    try {
        const dares = await db.list("dares");
        const truths = await db.list("truths");
        console.log("loaded: ", dares.length + truths.length);
    } catch (error) {
        console.error('Error loading dares and truths:', error);
    }

    console.log("loading events:");

    // Load event files
    const eventsPath = path.join(__dirname, "events");
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    eventFiles.forEach(file => {

        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        console.log(event.name);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            global.client.on(event.name, (...args) => event.execute(...args));
        }
    });

    // Load commands
    loadCommands(client, "global");
    loadCommands(client, "mod");

    setupVoteServer();

    // Start the bot
    client.login(my.secret);

    //uptime Kuma Ping
    const axios = require('axios'); // Ensure axios is required at the top

    setInterval(async () => {
        try {
            const response = await axios.get('https://uptime.vulps.co.uk/api/push/EaJ73kd8Km?status=up&msg=OK&ping='); // Replace with your URL
        } catch (error) {
            console.error('Ping failed:', error.message);
        }
    }, 60000); // 60000 milliseconds = 60 seconds

}

main().catch(error => {
    console.error('Failed to start the bot:', error);
});

function loadCommands(client, type) {
    const commandsPath = path.join(__dirname, `commands/${type}`);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    commandFiles.forEach(file => {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
        } else {
            console.warn(`[WARNING] The command at ${filePath} is missing a required 'data' or 'execute' property`);
        }
    });
}

async function setupVoteServer() {
    const app = express();
    app.use(express.json());

    app.post('/vote', async (req, res) => {  // Make the callback function async
        const voteData = req.body;
        console.log("Incoming vote!");
        console.log(req.body);
        // Verify the request
        if (req.headers.authorization !== my.top_gg_webhook_secret) {
            console.log("UNAUTHORIZED")
            return res.status(403).send('Unauthorized');
        }

        // Process the vote
        const userId = voteData.user;
        const botId = voteData.bot;
        const isWeekend = voteData.isWeekend;


        /**
         * @type {User}
         */
        let user = await new User(userId).get();

        if (!user) {
            console.log("User not found");
            return;
        }

        user.addVote(isWeekend ? 2 : 1);
        await user.save();

        logger.log(`User ${userId} voted for bot ${botId}. Weekend multiplier: ${isWeekend}`);

        res.status(200).send('Vote received');
    });

    app.listen(3002, '0.0.0.0', () => console.log('Webhook server running on port 3002'));
}
