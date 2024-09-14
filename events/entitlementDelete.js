const { Events, Entitlement } = require("discord.js")
const Server = require("../objects/server");
const logger = require("../objects/logger");
const Purchase = require("../objects/purchase");

module.exports = {
    name: Events.EntitlementDelete,
    /**
     * 
     * @param {Entitlement} entitlement 
     */
    async execute(entitlement) {
        console.log("Entitlement Recieved");
        console.log(entitlement);

        const purchase = await Purchase.get(entitlement.id);

        purchase.deleted = true;
        await purchase.save()

        const server = new Server(purchase.guildId);
        await server.load();

        server.is_entitled = false;
        server.entitlement_end_date = null;
        await server.save();
        console.log(purchase);

        logger.log(`**Entitlement** - ${server.name} has lost their premium subscription`);
    }
}