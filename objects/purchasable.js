const Database = require('objects/database');
const PurchasableType = require('./types/purchasableType');

class Purchasable {
    static SKIP10 = "SKIP_10";
    static PREMIUM_MONTHLY = "PREMIUM_MONTHLY";


    constructor(name = null) {
        this.name = name;
        this.skuId = null;
        this.type = null;
    }

    /** Sets SKU manually instead of using name */
    withSKU(sku) {
        this.skuId = sku;
        return this; // Allows method chaining
    }


    async load() {
        const db = new Database();
        const environment = my.environment

        let identifier = `name = '${this.name}'`;
        if (this.skuId) {
            identifier = `sku_id = '${this.skuId}'`;
        }

        const data = await db.query(`SELECT * FROM purchasables WHERE ${identifier} AND environment = '${environment}'`);

        if (!data) {
            throw new Error(`Purchasable ${this.name} not found for environment ${environment}`);
        }

        this.applicationId = data[0].application_id;
        this.name = data[0].name;
        this.skuId = data[0].sku_id;
        this.type = data[0].type;
        this.environment = data[0].environment;
        this.createdAt = new Date(data[0].created_at);

        return this;
    }

    isConsumable() {
        return this.type === PurchasableType.CONSUMABLE;
    }

    isSubscription() {
        return this.type === PurchasableType.SUBSCRIPTION;
    }
}

module.exports = Purchasable;
