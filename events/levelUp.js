const { Client, TextChannel } = require("discord.js");
const Events = require("./Events");
const User = require("../objects/user");
const Server = require("../objects/server");

module.exports = {
        name: Events.LevelUp,

        /**
         * 
         * @param {User} user 
         */
        async execute(user, type) {

                const client = global.client
                console.log(client);
                if(!user.serverUserLoaded) await user.loadServerUser();

                if (!user.serverId) throw new Error("Level up was triggered but no server ID was present to notify the user");

                const server = new Server(user.serverId);
                await server.load();
                //get level up channel
                /** @type {TextChannel} */
                const channel = client.channels.cache.get(server.level_up_channel);
                if (!channel || channel == "UNSET") return;
                if(type == "server") channel.send(`Congratulations ${user.username}! You have leveled up to level ${user.serverLevel}! Use \`/rank\` to check your rank!`);
                if(type == "global") channel.send(`Congratulations ${user.username}! You have leveled up globally to level ${user.globalLevel}! Use \`/rank\` to check your rank!`);
        }
}