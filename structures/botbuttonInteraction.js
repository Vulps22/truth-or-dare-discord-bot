// /structures/BotButtonInteraction.js
const { BotMessageInteraction } = require('./botMessageInteraction');

class BotButtonInteraction extends BotMessageInteraction {
    /**
     * @param {import('discord.js').ButtonInteraction} interaction
     */
    constructor(interaction) {
        // Call the parent constructor to set up the shared stuff
        super(interaction);

        this._baseId = null;
        this._customData = {};
        this._parseCustomId();
    }
}

module.exports = { BotButtonInteraction };