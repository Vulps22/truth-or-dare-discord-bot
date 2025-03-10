const { Events, TextChannel, Client, PermissionFlagsBits } = require('discord.js');
const Database = require('../objects/database');
const logger = require('objects/logger');

module.exports = {
    name: Events.ClientReady,
    once: true,
	/**
	 * 
	 * @param {Client} client 
	 */
    async execute(client) {
        console.log(`Shard ${client.shard.ids[0]} is ready with ${client.guilds.cache.size} servers!`);

        // Wait until all shards are ready
        await waitForAllShards(client);

		const db = new Database();

        // Fetch all subscribed servers from the database
        const subscribedServers = await db.query(`SELECT id AS serverId, announcement_channel AS channelId FROM servers WHERE id='${my.guildId}' AND announcement_channel IS NOT NULL`);

		console.log(subscribedServers);

        for (const { serverId, channelId } of subscribedServers) {
            const guild = client.guilds.cache.get(serverId);
            if (!guild) continue; // The bot isn't in this server on this shard

            const targetChannel = guild.channels.cache.get(channelId);
            if (!targetChannel) continue;

            if (!targetChannel.permissionsFor(client.user).has(PermissionFlagsBits.ManageWebhooks)) {
                logger.log(`Skipping ${guild.name} - missing MANAGE_WEBHOOKS permission.`);
                try {
                    await targetChannel.send("I have tried to update the announcement process to take advantage of Discord's 'Follow' feature. Please give me MANAGE_WEBHOOKS permission and run /setup to continue receiving announcements.");
                } catch (error) {
                    logger.error(`Failed to send permission request message to ${guild.name}:`, error);
                }
                continue;
            }

            // Check if the official announcement and bot update channels are in this shard
            const officialGuild = client.guilds.cache.get(my.guildId);
            if (officialGuild) {
                const announcementChannel = officialGuild.channels.cache.get(my.announcementChannelId);
                const updateChannel = officialGuild.channels.cache.get(my.updateChannelId);
                if (announcementChannel && updateChannel) {
                    try {
                        await announcementChannel.addFollower(targetChannel.id, 'Migrated from old method');
                        await updateChannel.addFollower(targetChannel.id, 'Migrated from old method');
						nullifyAnnouncementId(serverId);
                        await targetChannel.send("I have just updated my announcement process. This channel is now subscribed to the announcement and bot update channels of the official server. You can unsubscribe at any time through the channel's integrations settings.");
                        logger.log(`✅ Subscribed ${guild.name} to announcements and bot updates.`);
                    } catch (error) {
                        logger.error(`Failed to subscribe ${guild.name}:`, error);
                    }
                }
            } else {
                // Send an IPC request to a shard that has the official server
                client.shard.broadcastEval(async (c, { targetChannelId, serverId, logger }) => {
                    const officialGuild = c.guilds.cache.get(my.guildId);
                    if (officialGuild) {
                        const announcementChannel = officialGuild.channels.cache.get(my.announcementChannelId);
                        const updateChannel = officialGuild.channels.cache.get(my.updateChannelId);
                        if (announcementChannel && updateChannel) {
                            try {
                                await announcementChannel.addFollower(targetChannelId, 'Migrated from old method');
                                await updateChannel.addFollower(targetChannelId, 'Migrated from old method');
								nullifyAnnouncementId(serverId);
                                await c.channels.cache.get(targetChannelId).send("I have just updated my announcement process. This channel is now subscribed to the announcement and bot update channels of the official server. You can unsubscribe at any time through the channel's integrations settings.");
                                logger.log(`✅ Subscribed ${serverId} to announcements and bot updates.`);
                                return true;
                            } catch (error) {
                                logger.error(`IPC Subscription Failed for ${serverId}:`, error);
                            }
                        }
                    }
                    return false;
                }, { context: { targetChannelId: channelId, serverId } });
            }
        }
    }
};

async function waitForAllShards(client) {
    let allReady = false;

    while (!allReady) {
        try {
            const results = await client.shard.broadcastEval(c => { return c.isReady(); });
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