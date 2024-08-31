const { Events } = require("discord.js");
const Database = require("../objects/database");
const logger = require("../objects/logger");
const Server = require("../objects/server");

module.exports = {
    name: Events.GuildDelete,
    async execute(guild) {
        if(guild.id == '1190356693691928606') return;
        
        try {
            logger.log(`Removing a server: ${guild.name} with ID: ${guild.id}`)
            const db = new Database();

            let server = await new Server(guild.id).load();

            if (!server._loaded) {
                logger.error("Tried to delete a server that never existed:", guild.id);
                throw new Error("Somehow tried to delete a server that never existed");
            }

            if (server.isBanned) {
                logger.log("Server is banned, not deleting:", guild.id);
                return;
            }

            await db.delete('servers', server.id);
            await logger.deleteServer(server.message_id);
            logger.log("Deleted server:", guild.id);
        } catch (error) {
            console.error("Error during guildDelete event:", error);
        }
    }
};
