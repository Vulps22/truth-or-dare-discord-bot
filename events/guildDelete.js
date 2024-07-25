const { Events } = require("discord.js");
const Database = require("../objects/database");
const logger = require("../objects/logger");
const Server = require("../objects/server");

module.exports = {
    name: Events.GuildDelete,
    async execute(guild) {
        try {
            console.log("Guild deleted:", guild.id);
            const db = new Database();

            let server = new Server(guild.id);
            await server.load();

            if (!server._loaded) {
                console.error("Tried to delete a server that never existed:", guild.id);
                throw new Error("Somehow tried to delete a server that never existed");
            }

            if (server.isBanned) {
                console.log("Server is banned, not deleting:", guild.id);
                return;
            }

            await db.delete('servers', server.id);
            await logger.deleteServer(server.message_id);
            console.log("Deleted server:", guild.id);
        } catch (error) {
            console.error("Error during guildDelete event:", error);
        }
    }
};
