const { BotInteraction } = require("./botInteraction");
const { Message } = require("discord.js");

class BotMessageInteraction extends BotInteraction {
    constructor(interaction) {
        // Call the parent constructor to set up the shared stuff
        super(interaction);
    }

    /** @var {Message} */
    get message() { return this._interaction.message; }
}

module.exports = { BotMessageInteraction };