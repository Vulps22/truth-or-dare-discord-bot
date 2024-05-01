const Server = require("../objects/server");
const BanHandler = require("./banHandler");
const Handler = require("./handler");

class ServerHandler extends Handler {
    constructor() {
        super("server");
    }

    async banServer(interaction) {
        let server = await new Server().find(interaction.message.id);
        this.getBanReason(interaction, server.id);

    }
}

module.exports = ServerHandler;