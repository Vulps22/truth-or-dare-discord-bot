require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const Database = require('objects/database.js'); // Import Database class
const util = require('util');
const logger = require('objects/logger.js');
const cron = require('node-cron');
const Handler = require('handlers/handler');
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

    const db = new Database();

    try {
        const data = await db.get('config', process.env['ENVIRONMENT_KEY']);
        global.my = data;

    } catch (error) {
        console.error('Error loading config from database:', error);
        return;  // Exit if configuration loading fails
    }

    try {
        const questions = await db.list('questions');
    } catch (error) {
        console.error('Error loading dares and truths:', error);
    }

    // Load event files
    const eventsPath = path.join(__dirname, "events");
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    eventFiles.forEach(file => {

        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            global.client.on(event.name, (...args) => event.execute(...args));
        }
    });

    // Load commands
    loadCommands(client, "global");
    loadCommands(client, "mod");

    // Start the bot
    client.login(my.secret);

    //Uptime-kuma ping
    const axios = require('axios');
    const retry = require('async-retry'); // You might need to install async-retry via npm
    if (my.environment === "prod") {
        setInterval(async () => {
            try {
                await retry(async () => {
                    const response = await axios.get('https://uptime.vulps.co.uk/api/push/EaJ73kd8Km?status=up&msg=OK&ping=');
                }, {
                    retries: 3, // Retry up to 3 times
                    minTimeout: 1000, // Wait 1 second between retries
                });
                console.log('Ping succeeded');
            } catch (error) {
                console.error('Ping failed after retries:', error.message);
            }
        }, 60000); // Ping every 60 seconds
    } else {
        console.log("Not pinging uptime-kuma as this is not the prod environment.");
    }

    if (client.shard?.ids?.[0] === 0) {
        let isRunning = true;
        cron.schedule('*/10 * * * * *', async () => {
            if(isRunning) return; // Prevent multiple executions
            console.log('[AutoFail] Shard 0 running 48h timeout check...');
            isRunning = true;
            let handler = new Handler(client);
            await handler.expireQuestions();
            isRunning = false;
        });
    }


}

init().catch(error => {
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



