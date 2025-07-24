require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const util = require('util');
const logger = require('objects/logger.js');
const ConfigService = require('./services/ConfigService');
const loadEvents = require('loaders/loadEvents');
const loadButtons = require('loaders/loadButtons');
const loadCommands = require('loaders/loadCommands');
overrideConsoleLog();

console.log('Initialising Bot....');

process.on('uncaughtException', (err, origin) => {
    if (err.code === 10062) {
        console.error("skipping unknown interaction");
        return;
    }
    console.error(err);
    console.error(origin);
    logger.error(err.name + "\n" + err.message + "\n" + err.stack);
});

global.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
client.commands = new Collection();

async function init() {
    await ConfigService.loadConfig();
    global.my = ConfigService.config;

    /** Loaders */
    loadEvents(client);
    loadCommands(client, "global");
    loadCommands(client, "mod");
    loadButtons(client);

    // Start the bot
    client.login(my.secret);

    //Uptime-kuma ping
    const axios = require('axios');
    const retry = require('async-retry'); // You might need to install async-retry via npm

    setInterval(async () => {
        try {
            await retry(async () => {
                await axios.get('https://uptime.vulps.co.uk/api/push/EaJ73kd8Km?status=up&msg=OK&ping=');
            }, {
                retries: 3, // Retry up to 3 times
                minTimeout: 1000, // Wait 1 second between retries
            });
            console.log('Ping succeeded');
        } catch (error) {
            console.error('Ping failed after retries:', error.message);
        }
    }, 60000); // Ping every 60 seconds

}

init().catch(error => {
    console.error('Failed to start the bot:', error);
});



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



