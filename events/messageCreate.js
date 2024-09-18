const { Events, Message } = require("discord.js");
const User = require("objects/user");
const Database = require("objects/database");
const { exit } = require("process");

module.exports = {
    name: Events.MessageCreate,

    /**
     * 
     * @param {Message} message 
     */
    async execute(message) {

        if (message.author.bot) return;


        /**
         * @type {User}
         */
        const user = await new User(message.author.id).get();
        if (!user) return;
        await user.loadServerUser(message.guildId);

        if (user._serverUserLoaded && await user._server.isUsingMessageLevelling()) {
            await user.addServerXP(user._server.message_xp);
        }
    }
}