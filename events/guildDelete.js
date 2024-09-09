const { Events } = require("discord.js");
const Server = require("../objects/server");
const logger = require("../objects/logger");
const User = require("../objects/user");

module.exports = {
    name: Events.GuildDelete,
    async execute(guild) {
        if (guild.id == '1190356693691928606') return;

        try {
            logger.log(`Removing a server: ${guild.name} with ID: ${guild.id}`);

            const server = await new Server(guild.id).load();

            if (!server._loaded) {
                logger.error("Tried to delete a server that never existed:", guild.id);
                throw new Error("Somehow tried to delete a server that never existed");
            }

            if (server.isBanned) {
                logger.log("Server is banned, not deleting:", guild.id);
                return;
            }

            // Fetch users linked to the server
            /** @type {User[]} */
            const users = await server.getUsers();

            // Delete the server and its server-user relationships
            await server.deleteServer();

            // Mark each user for deletion if they are not banned and not in any other servers
            for (const user of users) {
                await user.checkAndMarkForDeletion();
            }

            logger.log("Deleted server:", guild.id);
        } catch (error) {
            console.error("Error during guildDelete event:", error);
        }
    }
};
