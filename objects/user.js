const Database = require("./database");

class User {

    id;
    serverId;
    username;
    globalXP;
    serverXP;
    isBanned;
    banReason;

    levelRandomiser = 1.254;
    levelMultiplier = 100;

    serverUserLoaded = false;

    constructor(id, username) {
        this.id = id;
        this.username = username;
        this.globalXP = 0;
        this.serverXP = 0;
        this.isBanned = false;
        this.banReason = '';
    }

    async get() {
        return this.load().then(didLoad => {
            if (!didLoad) {
                if (!this.username) return false;
                return this.save().then(() => this);
            }
            return this;
        });
    }

    /**
     * Saves the user's data to the database
     */
    async save() {
        const db = new Database();
        await db.set('users', { id: this.id, username: this.username, global_xp: this.globalXP, is_banned: this.isBanned, ban_reason: this.banReason });
    }

    /**
     * Loads the user's data from the database
     * Should only be used within the class constructor
     * @returns {boolean} Whether the user was successfully loaded
     */
    async load() {

        const db = new Database();
        let user = await db.get('users', this.id)

        if (!user) return false;

        this.username = user.username;
        this.globalXP = user.global_xp;
        this.isBanned = user.is_banned;
        this.banReason = user.ban_reason;
        return true;
    }

    async loadServerUser(serverId) {
        const db = new Database();
        
        let serverUserRaw = await db.query(`SELECT * FROM server_users WHERE user_id = ${this.id} AND server_id = ${serverId}`);
        let serverUser = serverUserRaw[0];

        if(!serverUser) {
            console.log("no server user, adding one");
            await this.addServerUser(serverId);
            this.serverUserLoaded = true;
            return;
        }

        this.serverXP = serverUser.server_xp;
        this.serverUserLoaded = true;

    }

    async addServerUser(serverId) {
        const db = new Database();
        await db.set('server_users', { user_id: this.id, server_id: serverId, server_xp: 0 });
    }

    async saveServerUser() {
        if(!this.serverUserLoaded) return;
        const db = new Database();
        await db.set('server_users', { user_id: this.id, server_id: serverId, server_xp: this.serverXP });
    }

    getLevel() {
        return this.calculateLevel(this.globalXP);
    }

    calculateLevel(xp) {
        let level = (xp / this.levelRandomiser) / this.levelMultiplier;
        return Math.floor(level)
    }

    calculateXpForLevel(level) {
        let xp = level * this.levelMultiplier * this.levelRandomiser;
        return Math.ceil(xp);
    }


    async addXP(xp) {
        this.globalXP += xp;
        this.save();
    }

    async subtractXP(xp) {
        this.globalXP -= xp;
        this.save();
    }

    async addServerXP(xp) {
        this.serverXP += xp;
        this.saveServerXP(serverId);
    }

    async subtractServerXP(xp) {
        this.serverXP -= xp;
        this.saveServerXP(serverId);
    }

    /**
     * Counts the number of dares the user has done successfully
     */
    async daresDone() {
        const db = new Database();
        //use db.query(sql) to get the number of dares from user_dares where done_count >= 5
        let dares = await db.query(`SELECT COUNT(*) as count FROM user_dares WHERE user_id = ${this.id} AND done_count >= 5`);
        return dares[0].count;
    }

    /**
     * Counts the number of dares the user has failed
     */
    async daresFailed() {
        const db = new Database();
        //use db.query(sql) to get the number of dares from user_dares where failed_count >= 5
        let dares = await db.query(`SELECT COUNT(*) as count FROM user_dares WHERE user_id = ${this.id} AND failed_count >= 5`);
        return dares[0].count;
    }

    /**
     * Counts the number of truths the user has done successfully
     */
    async truthsDone() {
        const db = new Database();
        //use db.query(sql) to get the number of truths from user_truths where done_count >= 5
        let truths = await db.query(`SELECT COUNT(*) as count FROM user_truths WHERE user_id = ${this.id} AND done_count >= 5`);
        return truths[0].count;
    }

    /**
     * Counts the number of truths the user has failed
     */
    async truthsFailed() {
        const db = new Database();
        //use db.query(sql) to get the number of truths from user_truths where failed_count >= 5
        let truths = await db.query(`SELECT COUNT(*) AS count FROM user_truths WHERE user_id = ${this.id} AND failed_count >= 5`);
        return truths[0].count;
    }
}

module.exports = User