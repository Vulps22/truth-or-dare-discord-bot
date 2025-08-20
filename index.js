const { ShardingManager } = require('discord.js');
const Database = require('objects/database');
const { AutoPoster } = require('topgg-autoposter');
require('dotenv').config();

const path = require('node:path');
const { Client, EmbedBuilder } = require('discord.js');
const express = require('express');
const cors = require('cors');
const User = require('objects/user.js');
const logger = require('objects/logger.js');
const UserHandler = require('handlers/userHandler.js');



/**
 * @typedef {Object} Config
 * @property {boolean} maintenance_mode - Indicates if the bot is in maintenance mode.
 * @property {string|null} secret - The bot's token.
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
    secret: null,
    dares_log: '1160740531094159492',
    truths_log: '1160740531094159492',
    servers_log: '1160740531094159492',
    required_votes: 3,
    environment: 'stage'
};


async function main() {
    const db = new Database();
    try {
        const data = await db.get('config', process.env['ENVIRONMENT_KEY']);
        global.my = data;
        console.log(my);
    } catch (error) {
        console.error('Error loading config from database:', error);
        return;  // Exit if configuration loading fails
    }



    const manager = new ShardingManager('./bot.js', {
        token: my.secret,
        totalShards: my.environment === 'dev' ? 2 : 'auto' // Force 2 shards in dev, auto in prod
    });


    manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));

    manager.spawn();

    
    setupVoteServer();
    scheduleDailyCleanup();
    syncGG(manager);
    scheduleTopGGUpdate(manager);
    uptimeKuma();
}

main().catch(error => {
    console.error('Failed to start the shard manager:', error);
});


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

/**
 * Every 12 hours, update the bot's stats on top.gg
 * @param {ShardingManager} manager - The ShardingManager instance.
 */
function scheduleTopGGUpdate(manager) {
    const updateInterval = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

    setInterval(async () => {
        console.log("Updating bot stats on top.gg...");
        syncGG(manager);
        
    }, updateInterval);
}

/**
 * Function to sync the bot's stats with top.gg
 * @param {ShardingManager} manager 
 */
function syncGG(manager){
    if(my.environment !== 'prod'){
        console.log("Not in prod, skipping top.gg sync.");
        return;
    }

    try {
        const ap = AutoPoster(my.top_gg_token, manager);
        ap.on('posted', () => {
            console.log('Updated bot stats on top.gg');
        });
    } catch (error) {
        console.error('Error updating bot stats on top.gg:', error);
    }
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
            console.log("Expected | Actual: ", my.top_gg_webhook_secret, req.headers.authorization)
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

    app.listen(3002, () => {
        console.log('Vote server is listening on port 3000');
    });
}