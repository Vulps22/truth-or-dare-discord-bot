const { Client, TextChannel, GuildMember } = require("discord.js");
const Events = require("./Events");
const User = require("../objects/user");
const Server = require("../objects/server");
const logger = require("../objects/logger");

module.exports = {
        name: Events.LevelUp,

        /**
         * 
         * @param {User} user 
         * @param {"global" | "server"} type
         */
        async execute(user, type) {
                logger.log(`Handling level up for user: ${user.username} with ID: ${user.id}`);
                const client = global.client;
                if (!user.serverUserLoaded) await user.loadServerUser();

                if (!user.serverId) throw new Error("Level up was triggered but no server ID was present to notify the user");

                const server = new Server(user.serverId);
                await server.load();

                // Get level up channel
                /** @type {TextChannel} */
                const channel = client.channels.cache.get(server.level_up_channel);
                if (!channel || channel === "UNSET") return;

                // Send level-up message
                if (type === "server") {
                        channel.send(`Congratulations <@${user.id}>! You have leveled up to level ${user.serverLevel}! Use \`/rank\` to check your rank!`);
                } else if (type === "global") {
                        channel.send(`Congratulations <@${user.id}>! You have leveled up globally to level ${user.globalLevel}! Use \`/rank\` to check your rank!`);
                }

                // For server leveling, assign role if applicable
                if (type !== 'server') return;

                const role = await server.getLevelRole(user.serverLevel);
                if (!role) return;

                const member = await channel.guild.members.fetch(user.id);
                if (!member) return;

                if (!checkPermissions(channel.guild.members.me)) {
                        channel.send(`Unable to assign <@&${role}> to <@${user.id}>. I need the manage_roles permission.`)
                        return;
                }

                // Check if the member already has the role
                if (member.roles.cache.has(role)) {
                        logger.log(`User ${user.username} already has the role for level ${user.serverLevel}. No need to add.`);
                        return;
                }

                try {
                        // Add the role to the user
                        await member.roles.add(role);
                } catch (error) {
                        channel.send("Unable to apply the new role. This is usually because my role is lower than the role i am trying to assign.")
                }
        }

}

/**
 * Ensure the bot has the manage_roles permission before assigning a role
 * @param {GuildMember} me
 */
function checkPermissions(me) {
        if (!me.permissions.has('ManageRoles')) {
                return false;
        }
        return true;
}