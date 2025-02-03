const { Events, Entitlement } = require("discord.js");
const logger = require("objects/logger");
const Purchase = require("objects/purchase");
const User = require("objects/user");

module.exports = {
    name: Events.EntitlementCreate,
    /**
     * 
     * @param {Entitlement} entitlement 
     */
    async execute(entitlement) {
        console.log("Entitlement Received");
        console.log(entitlement);
        // Commenting out the existing code for premium servers
        /*
        const purchase = await Purchase.withData(entitlement)
        const server = new Server(purchase.guildId);
        await server.load();

        server.is_entitled = true;
        if(purchase.endDate) server.entitlement_end_date = purchase.endDate;
        await server.save();
        console.log(purchase);

        logger.log(`**Entitlement** - ${server.name} has become a premium server`);
        */

        // New code to handle a one-time consumable purchase
        const purchase = await Purchase.withData(entitlement);
    
        if (purchase.isConsumable) {

            /** @type {User} */
            user = new User(purchase.userId);
            await user.load();
            await user.addVote(10, true);
            // Handle the consumable purchase logic here
            console.log(`Consumable purchase processed for user: ${purchase.userId}`);
            logger.log(`**Entitlement** - Consumable purchase processed for user: ${purchase.userId}`);
            purchase.consume();
        } else {
            console.log("Non-consumable purchase received");
            logger.log("**Entitlement** - Non-consumable purchase received");
        }
    }
}