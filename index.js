require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection, SlashCommandRoleOption, EmbedBuilder } = require('discord.js');
const Database = require('objects/database.js'); // Import Database class
const express = require('express');
const cors = require('cors');
const User = require('objects/user.js');
const logger = require('objects/logger.js');
const Server = require('objects/server.js');
const util = require('util');
const UserHandler = require('handlers/userHandler.js');

overrideConsoleLog();

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


global.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
client.commands = new Collection();


async function main() {

    const db = new Database();
    try {
        const data = await db.get('config', 3);
        global.my = data;
        console.log(my);
    } catch (error) {
        console.error('Error loading config from database:', error);
        return;  // Exit if configuration loading fails
    }

    try {
        const questions = await db.list('questions');
        console.log("loaded: ", questions.length);
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

    scheduleDailyCleanup();

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

    app.use(cors());

    app.post('/announce', async (req, res) => {
        console.log(`New Announcement Send Request`)
        // Compare the hashed passwords
        const isMatch = req.body.password === my.announce_password;

        if (!isMatch) {
            return res.status(403).json({ message: 'Invalid password' });
        }

        console.log("Annoucement Revieved");
        console.log(req.body);

        const content = req.body;

        const embed = new EmbedBuilder()
            .setTitle(content.title)
            .setDescription(content.description)
            .addFields(content.fields)
            .setColor(content.color || '#ffffff');

        const db = new Database();

        const servers = await db.query("SELECT hasAccepted, isBanned, announcement_channel FROM servers");

        await rateLimitedAnnounce(servers, embed);

        res.status(200).json({ message: "success" });
    });

    app.get('/announce', async (req, res) => {

        console.log("Announcement View Requested");

        if (!my.announce_password) {
            res.sendFile(path.join(__dirname, 'views', 'password_set.html'));
        }

        res.sendFile(path.join(__dirname, 'views', 'announce.html'));
    });

    app.post('/set_password', async (req, res) => {
        // Check if the password is provided in the request body
        if (!req.body.password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        const db = new Database();

        try {
            // Escape the password to prevent SQL injection
            const escaped_pass = db.escape(req.body.password);

            // Update the password in the database
            await db.query(`UPDATE config SET announce_password = ${escaped_pass} WHERE id = 1`);
            my.announce_password = escaped_pass;
            // Send a success response
            res.status(200).json({ message: 'Password set successfully' });
        } catch (error) {
            console.error('Error setting password:', error);
            res.status(500).json({ message: 'An error occurred while setting the password' });
        }
    });

    app.listen(3002, '0.0.0.0', () => console.log('Webhook server running on port 3002'));
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function rateLimitedAnnounce(servers, embed, delayTime = 100) {
    console.log(servers);
    for (const server of servers) {
        if (server.hasAccepted && !server.isBanned && server.announcement_channel) {
            await announce(embed, server.announcement_channel);
        }
        await delay(delayTime); // Delay of 100ms (1/10th of a second)
    }
}

/**
 * 
 * @param {EmbedBuilder} embed 
 * @param {string} server 
 */
async function announce(embed, channelId) {

    if (!channelId) {
        console.log("Announcement Channel not set")
        return;
    }
    console.log("Announcing to:", channelId);
    /** @type {Client} */
    let client = global.client;
    channel = client.channels.cache.get(channelId);
    try {
        await channel.send({ embeds: [embed] })
    } catch (error) {
        return;
    }
}

function overrideConsoleLog() {
    const originalLog = console.log;

    console.log = function (...args) {
        const stack = new Error().stack;
        const stackLine = stack.split('\n')[2]; // The caller line is usually the 3rd line in the stack
        const match = stackLine.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/) || stackLine.match(/at\s+(.*):(\d+):(\d+)/);

        let fileName = 'unknown';
        let lineNumber = 'unknown';

        if (match) {
            fileName = match[2] || match[1]; // The file path
            lineNumber = match[3]; // The line number
        }

        // Extract just the file name from the full path
        const path = fileName.split('\\');

        const shortFileName = path[path.length - 1];

        // Format the log message
        const prefix = `[${shortFileName}:${lineNumber}]`;

        // Call the original console.log with the modified message
        originalLog.call(console, prefix, util.format(...args));
    };
}

function scheduleDailyCleanup() {
    const userHandler = new UserHandler();

    // Function to calculate the milliseconds until midnight
    function getTimeUntilMidnight() {
        const now = new Date();
        const nextMidnight = new Date(now);
        nextMidnight.setHours(24, 0, 0, 0); // Set to midnight of the next day

        const timeTill = nextMidnight.getTime() - now.getTime(); // Milliseconds until next midnight

        // Convert milliseconds into hours, minutes, and seconds
        const hours = Math.floor(timeTill / (1000 * 60 * 60));
        const minutes = Math.floor((timeTill % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeTill % (1000 * 60)) / 1000);

        console.log(`Cleanup will commence in: ${hours} hours, ${minutes} minutes, and ${seconds} seconds.`);
        return timeTill;
    }

    // Schedule the first cleanUp at the next midnight
    setTimeout(() => {
        // Run cleanUp immediately at midnight
        userHandler.cleanUp();

        // Set an interval to run the cleanUp every 24 hours after the first run
        setInterval(() => {
            userHandler.cleanUp();
        }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

    }, getTimeUntilMidnight());
}



