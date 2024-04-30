const { Events } = require("discord.js");
const Database = require("../objects/database");

module.exports = {
    name: Events.GuildDelete,
    async execute(server) {
        const db = new Database();

        if (!server.isBanned) {
            return;
        }

        await db.delete('servers', server.id);
    }
};