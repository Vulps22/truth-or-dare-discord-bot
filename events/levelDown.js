const { Client, TextChannel, GuildMember } = require("discord.js");
const Events = require("events/Events");
const User = require("objects/user");
const Server = require("objects/server");
const logger = require("objects/logger");

module.exports = {
    name: Events.LevelDown, // Assuming you have an event for leveling down

    /**
     * Handle the level down event for a user, removing any roles they no longer qualify for.
     * 
     * @param {User} user - The user who has leveled down
     * @param {"global" | "server"} type - Type of leveling (global or server)
     */
    async execute(user, type) {
        logger.log(`Handling level down for user: ${user.username}`);
        if(type === "global") return; // No need to handle global level down
        /** @type {Client} */
        const client = global.client;

        if (!user._serverUserLoaded) await user.loadServerUser();
        if (!user.serverId) throw new Error("Level down was triggered but no server ID was present.");

        const server = new Server(user.serverId);
        await server.load();

        // Get the previous level's role to remove
        const oldLevelRole = await server.getLevelRole(user._serverLevel + 1); // Assuming previous level is current level + 1
        if (!oldLevelRole) return;

        /** @type {TextChannel} */
        const channel = client.channels.cache.get(server.level_up_channel); // Getting the channel object to fetch guild
        if (!channel || channel === "UNSET") return;

        const member = await channel.guild.members.fetch(user.id);
        if (!member) return;

        if (member.roles.cache.has(oldLevelRole)) {
            // Check if the bot has the permission to manage roles
            if (!checkPermissions(channel.guild.members.me)) {
                console.error(`Bot lacks permission to manage roles in guild: ${channel.guild.id}`);
                return;
            }

            // Remove the old level role
            member.roles.remove(oldLevelRole).then(() => {
                logger.log(`Removed role for previous level from user ${user.username}.`);
            }).catch(error => {
                logger.error(`Failed to remove role: ${error.message}`);
            });
        }
    }
}

/**
 * Checks if the bot has the 'MANAGE_ROLES' permission.
 * 
 * @param {GuildMember} me - The bot as a member of the guild.
 * @returns {boolean} True if the bot has the 'MANAGE_ROLES' permission, false otherwise.
 */
function checkPermissions(me) {
    return me.permissions.has('ManageRoles');
}
