const { Events, Entitlement } = require("discord.js");
const Server = require("objects/server");
const logger = require("objects/logger");
const Purchase = require("objects/purchase");
const User = require("objects/user");
const { skip } = require("node:test");

module.exports = {
    name: Events.EntitlementUpdate,
    /**
     * 
     * @param {Entitlement} oldEntitlement 
     * @param {Entitlement} newEntitlement 
     */
    async execute(oldEntitlement, newEntitlement) {
        console.log("Entitlement Updated");
        console.log(oldEntitlement, newEntitlement);

        const purchase = await Purchase.get(oldEntitlement.id);
        if (!purchase) {
            console.log("No matching purchase found.");
            return;
        }

        const user = await client.users.fetch(purchase.userId).catch(() => null); // Fetch the user
        if (!user) {
            console.log("User not found or unable to fetch.");
            return;
        }

        if (purchase.isConsumable) {
            console.log("Consumable purchase consumed.");
            purchase.endDate = new Date();

            try {
                botUser = new User(user.id);
                await botUser.load();
                skipCount = botUser.voteCount;
                await user.send(`✅ Thank You :) Your purchase of 10 skips has been successfully processed! You now have ${skipCount} remaining skips available to use.`);
            } catch (error) {
                console.error(`Failed to send DM to ${user.tag}:`, error);
            }
        } else {
            console.log("Processing Subscription Renewal");
            purchase.endDate = new Date(newEntitlement.endsTimestamp);
            purchase.save();

            const server = new Server(purchase.guildId);
            await server.load();

            server.is_entitled = true;
            server.entitlement_end_date = purchase.endDate;
            await server.save();
            console.log(purchase);

            logger.log(`**Entitlement** - ${server.name} has renewed their premium subscription`);

            try {
                await user.send("✅ Your premium subscription has been renewed successfully. Enjoy your benefits!");
            } catch (error) {
                console.error(`Failed to send DM to ${user.tag}:`, error);
            }
        }
    }
};
