const Database = require("objects/database");
const logger = require("objects/logger");

/** @typedef {import("objects/user")} User */


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
    entitlement_end_date = null;


    _loaded = false;

    constructor(id, name) {
        this.id = id;
        this.name = name;

        this._db = new Database();
    }


    async find(messageId) {

        const server = await this._db.query(`select id FROM servers WHERE message_id = ${messageId}`);
        if (server.length === 0) return false;
        const serverId = server[0].id;
        this.id = serverId;
        await this.load();
        return this;
    }

    async load() {
        // load server from database

        let serverData = await this._db.get("servers", this.id);

        if (!serverData) {
            this.name = 'Server Data No Longer Exists';
            this._loaded = false;
            return;
        };

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

        this._loaded = this.name ? true : false;

        return this;
    }

    /**
     * Loads and returns an array of Server instances populated from input data.
     * @param {Array<Object>} serverDataArray - Array of objects containing server data.
     * @returns {Server[]} - Array of populated Server instances.
     */
    static loadMany(serverDataArray) {
        return serverDataArray.map(data => {
            const server = new Server(data.id, data.name);  // Create new Server instance with id and name

            // Directly assign provided data to the server instance, avoiding any database calls
            server.owner = data.owner || null;
            server.hasAccepted = data.hasAccepted || 0;
            server.isBanned = data.isBanned || 0;
            server.banReason = data.banReason || null;
            server.level_up_channel = data.level_up_channel || null;
            server.announcement_channel = data.announcement_channel || null;
            server.message_id = data.message_id || null;
            server._date_created = data.date_created || null;
            server._date_updated = data.date_updated || null;
            server.dare_success_xp = data.dare_success_xp || 50;
            server.dare_fail_xp = data.dare_fail_xp || 25;
            server.message_xp = data.message_xp || 0;
            server.truth_success_xp = data.truth_success_xp || 40;
            server.truth_fail_xp = data.truth_fail_xp || 40;
            server.is_entitled = data.is_entitled || false;
            server.entitlement_end_date = data.entitlement_end_date || null;
            server._loaded = true;  // Mark as loaded since we're assigning values directly

            return server;  // Add to the array of servers
        });
    }

    async save() {
        //create an object of every property that doesn't have an underscore
        let serverData = {};
        for (let key in this) {
            if (key.startsWith("_")) continue;
            serverData[key] = this[key];
            if (my.environment == 'dev' && key == 'isBanned') serverData[key] = 0;
        }
        
        await this._db.set("servers", serverData);
        this._loaded = true;
    }

    async setLevelRole(roleId, level) {
        let role = await this.getLevelRole(level) // check if role already exists
        if (role) {
            // update role
            await this._db.query(`UPDATE server_level_roles SET role_id = '${roleId}' WHERE server_id = '${this.id}' AND level = ${level}`);
        } else {
            // add role
            await this._db.query(`INSERT INTO server_level_roles (server_id, role_id, level) VALUES ('${this.id}', '${roleId}', ${level})`);
        }
    }

    async getLevelRole(level) {

        // Adjusted query to get the highest level less than or equal to the given level
        const query = `
            SELECT role_id 
            FROM server_level_roles 
            WHERE server_id = '${this.id}' AND level <= ${level}
            ORDER BY level DESC
            LIMIT 1
        `;

        const results = await this._db.query(query);
        if (results.length > 0) {
            return results[0].role_id;  // Assuming the query returns at least one result
        } else {
            return null;  // No roles found for this level or below
        }
    }

    async hasPremium() {
        if (!this._loaded) await this.load();

        const endDate = await this.getEntitlementEndDate();
        return this.is_entitled > 0 && (!endDate || endDate === undefined || endDate > Date.now());
    }

    /**
     * 
     * @returns {Date}
     */
    async getEntitlementEndDate() {
        if (!this._loaded) await this.load();
        if (!this.entitlement_end_date) return null;
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

    /**
    * Deletes the server and its related server_user relationships
    */
    async deleteServer() {

        logger.deleteServer(this.message_id);

        const db = new Database();

        // Delete the server from the 'servers' table
        await db.delete('servers', this.id);

        // Delete server-user relationships from 'server_users'
        await db.query(`DELETE FROM server_users WHERE server_id = '${this.id}'`);
    }

    /**
     * Fetches all users linked to this server and returns them as User objects.
     * @returns {Promise<User[]>} The list of User objects.
     */
    async getUsers() {
        const { userFromObject } = require("./loader");

        const db = new Database();
        const userRecords = await db.query(`
            SELECT * 
            FROM users
            JOIN server_users ON users.id = server_users.user_id
            WHERE server_users.server_id = '${this.id}'
        `);

        if (!userRecords.length > 0) {
            console.log("No server_users found.")
            return [];
        }
        console.log(`Found ${userRecords.length} server_users`);
        // Convert the plain objects into User instances
        return userRecords.map(userRecord => userFromObject(userRecord));
    }

    /**
     * Get the message in the server log that was created when this server added the bot
     * @returns {Message}
     */
    async getMessage() {
        const channel = await getChannel(my.servers_log);
        const message = await channel.messages.fetch(this.message_id);
        return message;

    }


}

/**
 * 
 * @param {string} channelId 
 * @returns {TextChannel}
 */
function getChannel(channelId) {
    let client = global.client;
    return client.channels.cache.get(channelId);
}


module.exports = Server;