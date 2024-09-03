const { Events, Entitlement } = require("discord.js")
const Server = require("../objects/server");
const logger = require("../objects/logger");
const Purchase = require("../objects/purchase");

module.exports = {
    name: Events.EntitlementUpdate,
    /**
     * 
     * @param {Entitlement} entitlement 
     */
    async execute(oldEntitlement, newEntitlement) {
        console.log("Entitlement Updated");
        console.log(oldEntitlement, newEntitlement);

        const purchase = await Purchase.get(oldEntitlement.id);

        purchase.endDate = new Date(newEntitlement.endsTimestamp);
        purchase.save();

        const server = new Server(purchase.guildId);
        await server.load();

        server.is_entitled = true;
        server.entitlement_end_date = purchase.endDate;
        await server.save();
        console.log(purchase);

        logger.log(`**Entitlement** - ${server.name} has renewed their premium subscription`);
        
    }
}