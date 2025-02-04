const { Entitlement, EntitlementType } = require("discord.js");
const Database = require("objects/database");
const Purchasable = require("./purchasable");
const PurchasableType = require("./types/purchasableType");

class Purchase {

    /** @type {Entitlement} */
    entitlement = null;

    id = null;
    skuId = null;
    userId = null;
    guildId = null;
    /** @type {EntitlementType} */
    type = null;
    /** @type {Purchasable} */
    purchasable = null;

    startDate = null;
    endDate = null;

    deleted = false;
    consumed = false;
    _loaded = false;

    constructor(id) {
        this.id = id;
        this.startDate = new Date()
        
    }

    async load() {

        const db = new Database();
        const data = await db.get('entitlements', this.id);

        if (!data) return;

        const transformedEntitlementData = {
            id: data.entitlement.id,
            sku_id: data.entitlement.skuId,
            user_id: data.entitlement.userId,
            guild_id: data.entitlement.guildId,
            application_id: data.entitlement.applicationId,
            type: data.entitlement.type,
            deleted: data.entitlement.deleted,
            starts_timestamp: data.entitlement.startsTimestamp,
            ends_timestamp: data.entitlement.endsTimestamp,
            consumed: data.entitlement.consumed
        };


        this.skuId = data.skuId;
        this.userId = data.userId;
        this.guildId = data.guildId;
        this.type = data.type;
        this.startDate = new Date(data.start_timestamp);
        this.endDate = new Date(data.end_timestamp);
        this.deleted = data.deleted;
        this.consumed = data.consumed;
        this.entitlement = new Entitlement(my.client, transformedEntitlementData);

        this.purchasable = new Purchasable().withSKU(data.skuId);
        await this.purchasable.load(); // Get type from database

        this._loaded = true;

        return this
    }

    async save() {
        const db = new Database();

        console.log("entitlement: ", JSON.stringify(this.entitlement.toJSON()));

        db.set('entitlements', {
            id: this.id,
            skuId: this.skuId,
            userId: this.userId,
            guildId: this.guildId,
            type: this.type,
            start_timestamp: this.timestampToMySQLDateTime(this.startDate),
            end_timestamp: this.endDate && !isNaN(this.endDate) ? this.timestampToMySQLDateTime(this.endDate) : null,
            deleted: this.deleted,
            consumed: this.consumed,
            entitlement: JSON.stringify(this.entitlement.toJSON()),
        });
    }

    static async get(id) {
        const purchase = new Purchase(id);
        await purchase.load();
        return purchase;
    }

    isConsumable() {
        console.log("purchasable when reading type: ", this.purchasable);
        return this.purchasable.type == PurchasableType.CONSUMABLE;
    }

    async consume() {
        if (this.consumed) return;

        this.consumed = true;
        this.endDate = new Date();
        await this.save();

        this.entitlement.consume();
    }

    /**
     * 
     * @param {Entitlement} entitlement 
     */
    static async withData(entitlement) {
        const purchase = new Purchase(entitlement.id);
        purchase.skuId = entitlement.skuId;
        purchase.userId = entitlement.userId,
        purchase.guildId = entitlement.guildId,
        purchase.type = entitlement.type;
        purchase.startDate = entitlement.startsTimestamp ? new Date(entitlement.startsTimestamp) : new Date();
        purchase.endDate = entitlement.endsTimestamp ? new Date(entitlement.endsTimestamp) : null;
        purchase.deleted = entitlement.deleted;
        purchase.consumed = entitlement.consumed;
        purchase.entitlement = entitlement;

        purchase.purchasable = await new Purchasable().withSKU(entitlement.skuId).load();
        console.log("purchasable: ", purchase.purchasable);
        await purchase.save();

        return purchase;
    }
/**
 * 
 * @param {Date} date 
 * @returns 
 */
    timestampToMySQLDateTime(date) {
    
        // Step 2: Format the date to `YYYY-MM-DD HH:MM:SS`
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
    
        // Combine into MySQL DATETIME format
        const mysqlDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    
        return mysqlDateTime;
    }
}

module.exports = Purchase;
