const { Events, Entitlement } = require("discord.js");
const logger = require("objects/logger");
const Purchase = require("objects/purchase");
const User = require("objects/user");

const VOTE_INCREMENT = 10;

module.exports = {
    name: Events.EntitlementCreate,
    /**
     * Process entitlement events.
     * @param {Entitlement} entitlement 
     */
    async execute(entitlement) {
        try {
            logger.log("Entitlement Received with ID: " + entitlement.id);

            // Commenting out the existing code for premium servers - kept for later use
            /*
            const purchase = await Purchase.withData(entitlement);
            const server = new Server(purchase.guildId);
            await server.load();

            server.is_entitled = true;
            if (purchase.endDate) server.entitlement_end_date = purchase.endDate;
            await server.save();
            console.log(purchase);

            logger.log(`**Entitlement** - ${server.name} has become a premium server`);
            */

            // New code to handle a one-time consumable purchase
            const purchase = await Purchase.withData(entitlement);

            if (purchase.isConsumable()) {
                const user = new User(purchase.userId);
                await user.load();
                await user.addVote(VOTE_INCREMENT, true);
                logger.log(`**Entitlement** - Consumable purchase processed for user: ${purchase.userId}`);
                await purchase.consume();
            } else {
                logger.error("**Entitlement** - Non-consumable purchase received");
            }
        } catch (error) {
            logger.error(`Error processing entitlement with ID: ${entitlement.id}`);

            // Attempt to DM the user using the entitlement's data
            try {
                console.log(entitlement);
                const userId = entitlement.userId; // Assumes entitlement contains userId
                if (userId) {
                    const discordUser = await client.users.fetch(userId);
                    await discordUser.send(
                        `Something went wrong with your purchase (ID: ${entitlement.id}). Please contact support on the [Official Support Server](https://discord.gg/xZqqUP2hge)
`
                    );
                } else {
                    logger.error("Entitlement does not include a userId; unable to send DM.");
                }
            } catch (dmError) {
                logger.error("Failed to send DM to user:", dmError);
            }
        }
    }
};
