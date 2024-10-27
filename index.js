const { ShardingManager } = require('discord.js');
const Database = require('objects/database');
require('dotenv').config();



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
        const data = await db.get('config', 2);
        global.my = data;
        console.log(my);
    } catch (error) {
        console.error('Error loading config from database:', error);
        return;  // Exit if configuration loading fails
    }



    const manager = new ShardingManager('./bot.js')

    manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));

    manager.spawn();

}

main().catch(error => {
    console.error('Failed to start the shard manager:', error);
});