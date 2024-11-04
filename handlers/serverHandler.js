const Server = require("objects/server");
const Handler = require("handlers/handler");
const { Interaction } = require('discord.js');
const logger = require("objects/logger");

class ServerHandler extends Handler {
    constructor() {
        super("server");
    }

    /**
     * 
     * @param {Interaction} interaction 
     * @param {string} decision 
     */
    async banServer(interaction, decision) {
        let server = await new Server().find(interaction.message.id);

        if (!server) {
            interaction.reply({ content: 'This server does not exist and has likely kicked the bot', ephemeral: true });
            interaction.message.delete();
            return;
        }

        if(decision == 'ban'){
            this.getBanReason(interaction, server.id);
        } else {
            server.isBanned = 0;
            server.banReason = null;
            await server.save();
            logger.updateServer(server, false);
            interaction.editReply('Server has been Unbanned');
        }
    }
}

module.exports = ServerHandler;