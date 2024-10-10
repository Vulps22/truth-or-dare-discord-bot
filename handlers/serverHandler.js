const Server = require("objects/server");
const Handler = require("handlers/handler");
const { Interaction } = require('discord.js');

class ServerHandler extends Handler {
    constructor() {
        super("server");
    }

    /**
     * 
     * @param {Interaction} interaction 
     */
    async banServer(interaction) {
        let server = await new Server().find(interaction.message.id);

        if (!server) {
            interaction.reply({ content: 'This server does not exist and has likely kicked the bot', ephemeral: true });
            interaction.message.delete();
            return;
        }

        this.getBanReason(interaction, server.id);
    }
}

module.exports = ServerHandler;