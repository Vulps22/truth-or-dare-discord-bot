const { Events, Message } = require("discord.js");
const User = require("../objects/user");
const Database = require("../objects/database");

module.exports = {
	name: Events.MessageCreate,

    /**
     * 
     * @param {Message} message 
     */
	async execute(message) {
        /**
         * @type {User}
         */
        const user = await new User(message.author.id).get();
        await user.loadServerUser(message.guildId);
    
        if(await user.server.isUsingMessageLevelling()) {
            await user.addServerXP(user.server.message_xp);
        }
        
        console.log(`Message from ${message.author.username} - ${message.content} - ${user.serverLevelXP}`)
	}
}