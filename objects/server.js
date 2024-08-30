const Database = require("./database");

class Server {

    _db;

    id;
    name = null;
    owner = null;
    hasAccepted = 0;
    isBanned = 0;
    banReason = null;
    level_up_channel = null;
    announcement_channel = null;
    message_id = null;

    _date_created;
    _date_updated;

    dare_success_xp = 50;
    dare_fail_xp = 25;


    message_xp = 0;

    truth_success_xp = 40;
    truth_fail_xp = 40;

    is_entitled = false;
    entitlement_end_date;


    _loaded = false;

    constructor(id, name) {
        this.id = id;
        this.name = name;

        this._db = new Database();
    }


    async find(messageId) {
        const table = this.type + "s";
        const server = await this._db.query(`select id FROM servers WHERE message_id = ${messageId}`);
        const serverId = server[0].id;
        this.id = serverId;
        console.log(this.id);
        await this.load();
        return this;
    }

    async load() {
        // load server from database
        const db = new Database();
        let serverData = await db.get("servers", this.id);

        if (!serverData) return;

        this.name = serverData.name;
        this.owner = serverData.owner;
        this.hasAccepted = serverData.hasAccepted;
        this.isBanned = serverData.isBanned;
        this.banReason = serverData.banReason;
        this._date_created = serverData.date_created;
        this._date_updated = serverData.date_updated;
        this.dare_success_xp = serverData.dare_success_xp;
        this.dare_fail_xp = serverData.dare_fail_xp;
        this.truth_success_xp = serverData.truth_success_xp;
        this.truth_fail_xp = serverData.truth_fail_xp;
        this.message_xp = serverData.message_xp
        this.level_up_channel = serverData.level_up_channel;
        this.announcement_channel = serverData.announcement_channel;
        this.is_entitled = serverData.is_entitled;
        this.entitlement_end_date = serverData.entitlement_end_date;
        this.message_id = serverData.message_id;

        this._loaded = true;

        return this;
    }

    save() {
        // save server to database
        const db = new Database();

        //create an object of every property that doesn't have an underscore
        let serverData = {};
        for (let key in this) {
            console.log(key, this[key])
            if (key.startsWith("_")) continue;
            serverData[key] = this[key];
        }
        db.set("servers", serverData);

        this._loaded = true;
    }

    async setLevelRole(roleId, level) {
        let role = await this.getLevelRole(level) // check if role already exists
        if (role) {
            // update role
            const db = new Database();
            await db.query(`UPDATE server_level_roles SET role_id = '${roleId}' WHERE server_id = '${this.id}' AND level = ${level}`);
        } else {
            // add role
            const db = new Database();
            await db.query(`INSERT INTO server_level_roles (server_id, role_id, level) VALUES ('${this.id}', '${roleId}', ${level})`);
        }
    }

    async getLevelRole(level) {
        // Get the role for a specific level
        const db = new Database();

        // Adjusted query to get the highest level less than or equal to the given level
        const query = `
            SELECT role_id 
            FROM server_level_roles 
            WHERE server_id = '${this.id}' AND level <= ${level}
            ORDER BY level DESC
            LIMIT 1
        `;

        const results = await db.query(query);
        if (results.length > 0) {
            return results[0].role_id;  // Assuming the query returns at least one result
        } else {
            return null;  // No roles found for this level or below
        }
    }

    async hasPremium() {
        if (!this._loaded) await this.load();
        return this.is_entitled > 0 && await this.getEntitlementEndDate() > Date.now();
    }

    /**
     * 
     * @returns {Date}
     */
    async getEntitlementEndDate() {
        if (!this._loaded) await this.load();
        return new Date(this.entitlement_end_date);
    }

    async isUsingMessageLevelling() {
        return await this.hasPremium() && this.level_up_channel != null && this.message_xp > 0;
    }


    setXpRate(type, amount) {
        switch (type) {
            case 'dare_success':
                this.dare_success_xp = amount;
                break;
            case 'dare_fail':
                this.dare_fail_xp = amount;
                break;
            case 'truth_success':
                this.truth_success_xp = amount;
                break;
            case 'truth_fail':
                this.truth_fail_xp = amount;
                break;
            case 'message_sent':
                this.message_xp = amount;
                break;
        }
    }

    acceptedString() {
        return this.hasAccepted ? "Yes" : "No";
    }

    bannedString() {
        return this.isBanned ? "Yes" : "No";
    }

}

module.exports = Server;