const { Events, TextChannel, Client, PermissionFlagsBits } = require('discord.js');
const Database = require('../objects/database');
const logger = require('objects/logger');
const cron = require('node-cron');
const Handler = require('handlers/handler');

module.exports = {
    name: Events.ClientReady,
    once: true,
    /**
     * @param {Client} client 
     */
    async execute(client) {

        console.log(`Shard ${client.shard.ids[0]} is ready with ${client.guilds.cache.size} servers!`);

        // Wait until all shards are ready
        await waitForAllShards(client);

        // auto expire questions every 48h
        if (client.shard?.ids?.[0] === 0) {
            let isRunning = false;
            cron.schedule('0 * * * * ', async () => {
                if (isRunning) return; // Prevent multiple executions
                console.log('[AutoFail] Shard 0 running 48h timeout check...');
                isRunning = true;
                let handler = new Handler(client);
                await handler.expireQuestions();
                isRunning = false;
            });
        }
    }
};

async function waitForAllShards(client) {
    let allReady = false;
    while (!allReady) {
        try {
            const results = await client.shard.broadcastEval(c => c.isReady());
            console.log(results);
            const notReadyCount = results.filter(ready => !ready).length;
            allReady = results.every(ready => ready);
            if (!allReady) {
                console.log(`⏳ Shard ${client.shard.ids[0]} is waiting for all shards to be ready... (${notReadyCount} shards not ready)`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 sec before checking again
            }
        } catch (error) {
            console.error(`❌ Shard ${client.shard.ids[0]} encountered an error while waiting for shards to be ready: Probably not ready`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait longer before retrying in case of failure
        }
    }
    console.log(`✅ Shard ${client.shard.ids[0]} confirms all shards are ready!`);
}

/**
 * Sets the announcement channel to null in the database after the announcement is sent
 * @param {import('discord.js').Snowflake} serverId 
 */
async function nullifyAnnouncementId(serverId) {
    const db = new Database();
    await db.query(`UPDATE servers SET announcement_channel = NULL WHERE id = ${serverId}`);
}
