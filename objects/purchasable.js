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

        const data = await db.query(`SELECT * FROM purchasables WHERE name = '${this.name}' AND environment = '${environment}'`);

        if (!data) {
            throw new Error(`Purchasable ${this.name} not found for environment ${environment}`);
        }

        this.skuId = data.sku_id;
        this.type = data.type;
    }

    isConsumable() {
        return this.type === PurchasableType.CONSUMABLE;
    }

    isSubscription() {
        return this.type === PurchasableType.SUBSCRIPTION;
    }
}

module.exports = Purchasable;
