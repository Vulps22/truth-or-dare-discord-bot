const { Events, Entitlement } = require("discord.js")
const Server = require("../objects/server");
const logger = require("../objects/logger");
const Purchase = require("../objects/purchase");

module.exports = {
    name: Events.EntitlementCreate,
    /**
     * 
     * @param {Entitlement} entitlement 
     */
    async execute(entitlement) {
        console.log("Entitlement Recieved");
        console.log(entitlement);

        const purchase = await Purchase.withData(entitlement)
        const server = new Server(purchase.guildId);
        await server.load();

        server.is_entitled = true;
        if(purchase.endDate) server.entitlement_end_date = purchase.endDate;
        await server.save();
        console.log(purchase);

        logger.log(`**Entitlement** - ${server.name} has become a premium server`);
    }
}