const Events = require("../events/Events");
const Database = require("./database");
const Server = require("./server");

class User {

    id;
    serverId;
    username;
    isBanned;
    banReason;
    voteCount;

    globalLevel;
    globalLevelXP;

    serverLevel;
    serverLevelXP;

    levelRandomiser = 1.254;
    levelMultiplier = 100;

    required_votes;

    ban_message_id;

    deleteDate;

    _loaded = false;

    /** @type {Server} */
    server;

    serverUserLoaded = false;

    constructor(id, username) {
        this.id = id;
        this.username = username;
        this.globalLevel = 0;
        this.globalLevelXP = 0;
        this.serverLevel = 0;
        this.serverLevelXP = 0;
        this.isBanned = false;
        this.banReason = '';
        this.required_votes = my.required_votes;
        this.voteCount = 0;
        this.deleteDate = null;
    }
    /**
     * 
     * @returns {Promise<User>}
     */
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

        let userData = {
            id: this.id,
            username: this.username,
            global_Level: this.globalLevel,
            global_level_xp: this.globalLevelXP,
            isBanned: my.environment == 'dev' ? 0 : this.isBanned,
            ban_reason: this.banReason,
            voteCount: this.voteCount,
            ban_message_id: this.ban_message_id
        }

        await db.set('users', userData);
        if (this.serverUserLoaded) await this.saveServerUser();
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
        this.globalLevel = user.global_level;
        this.globalLevelXP = user.global_level_xp;
        this.isBanned = user.isBanned;
        this.banReason = user.ban_reason;
        this.voteCount = user.voteCount;
        this.ban_message_id = user.ban_message_id;
        this.deleteDate = user.deleteDate;
        this._loaded = true;
        return true;
    }

    async loadServerUser(serverId) {
        const db = new Database();

        let serverUserRaw = await db.query(`SELECT * FROM server_users WHERE user_id = ${this.id} AND server_id = ${serverId}`);
        let serverUser = serverUserRaw[0];

        if (!serverUser) {
            console.log("no server user, adding one");
            await this.addServerUser(serverId);
            this.serverUserLoaded = true;
            return false;
        }
        this.serverId = serverUser.server_id;
        this.serverLevel = serverUser.server_level;
        this.serverLevelXP = serverUser.server_level_xp;

        this.server = new Server(serverId);
        await this.server.load();

        this.serverUserLoaded = true;
        return true;
    }

    async addServerUser(serverId) {
        const db = new Database();
        await db.set('server_users', { user_id: this.id, server_id: serverId, server_level: 0, server_level_xp: 0 });
        this.serverId = serverId,
            this.serverLevel = 0;
        this.serverLevelXP = 0;
        this.serverUserLoaded = true;
        this.server = new Server(serverId);
        await this.server.load();
    }

    async saveServerUser() {
        console.log("Registering new server User");
        if (!this.serverUserLoaded) return;
        const db = new Database();
        await db.query(`UPDATE server_users SET server_level = ${this.serverLevel}, server_level_xp = ${this.serverLevelXP} WHERE user_id = ${this.id} AND server_id = ${this.serverId}`);
    }

    /**
     * Creates a User instance from a plain object without needing to reload from the database.
     * @param {object} data - The object containing user data.
     * @returns {User} The instantiated User object.
     */
    static fromObject(data) {
        const user = new User(data.id, data.username);
        user.globalLevel = data.global_level;
        user.globalLevelXP = data.global_level_xp;
        user.isBanned = data.isBanned;
        user.banReason = data.ban_reason;
        user.voteCount = data.voteCount;
        user.ban_message_id = data.ban_message_id;
        user.deleteDate = data.deleteDate;
        user._loaded = true;

        return user;
    }

    /**
     * @deprecated Use globalLevel instead
     * @returns {number} The user's global level
     */
    getLevel() {
        return this.globalLevel;
    }

    /**
     * @deprecated Use serverLevel instead
     * @returns {number} The user's global level
     */
    getServerLevel() {
        return this.serverLevel;
    }

    /**
     * 
     * @deprecated use the globalLevel or serverLevel properties instead
     * @param {number} xp 
     * @returns {number} The user's level with the sapecified xp
     */
    calculateLevel(xp) {
        let level = (xp / this.levelRandomiser) / this.levelMultiplier;
        return Math.floor(level)
    }

    calculateXpForLevel(level) {
        let xp = level * this.levelMultiplier * this.levelRandomiser;
        return Math.ceil(xp);
    }

    getTotalGlobalXP() {
        let totalXP = 0;

        // Sum XP required for all levels up to the current level
        for (let level = 1; level <= this.globalLevel; level++) {
            totalXP += this.calculateXpForLevel(level);
        }

        // Add the XP gained in the current level
        totalXP += this.globalLevelXP;
        console.log("User has XP: ", totalXP);
        return totalXP;
    }

    getTotalServerXP() {
        if (!this.serverUserLoaded) return 0;

        let totalXP = 0;

        // Sum XP required for all server levels up to the current level
        for (let level = 1; level <= this.serverLevel; level++) {
            totalXP += this.calculateXpForLevel(level);
        }

        // Add the XP gained in the current server level
        totalXP += this.serverLevelXP;

        return totalXP;
    }


    willLevelUpGlobally(xpChange) {
        let currentLevel = this.globalLevel;
        let newXp = this.globalLevelXP + xpChange;
        let xpForNextLevel = this.calculateXpForLevel(currentLevel + 1);
        return newXp >= xpForNextLevel;
    }

    willLevelUpServerly(xpChange) {
        let currentLevel = this.serverLevel;
        let newXp = this.serverLevelXP + xpChange;
        let xpForNextLevel = this.calculateXpForLevel(currentLevel + 1);
        return newXp >= xpForNextLevel;
    }

    async getImage() {
        let discordUser = await global.client.users.fetch(this.id);
        let avatarURL = await discordUser.displayAvatarURL();

        // Fetching the avatar URL and ensuring it's a PNG
        const urlParts = avatarURL.split('.');
        urlParts[urlParts.length - 1] = 'png'; // Ensure the extension is 'png'
        avatarURL = urlParts.join('.');

        return avatarURL;
    }


    async addXP(xp) {
        if (this._loaded) await this.load();
        let didLevelUp = false;  // Flag to determine if a level-up event should be emitted.

        this.globalLevelXP += xp;  // Directly add XP to the current level XP.

        let xpNeededForNextLevel = this.calculateXpForLevel(this.globalLevel + 1);

        while (this.globalLevelXP >= xpNeededForNextLevel) {
            this.globalLevelXP -= xpNeededForNextLevel;  // Remove the XP needed for the next level, handling overflow.
            this.globalLevel++;  // Increment the level.

            // Re-calculate the XP needed for the next level after the level-up
            xpNeededForNextLevel = this.calculateXpForLevel(this.globalLevel + 1);

            didLevelUp = true;
        }

        if (didLevelUp) {
            if (!this.serverUserLoaded) throw Error("Attempted to emit level up before loading server User");
            global.client.emit(Events.LevelUp, this, "global");
        }


        await this.save();  // Save changes to the database.
    }


    async subtractXP(xp) {
        if (this.globalLevel == 0 && this.globalLevelXP == 0) return;  // Avoid operation if no XP.

        this.globalLevelXP -= xp;
        while (this.globalLevelXP < 0) {
            if (this.globalLevel == 0) {
                this.globalLevelXP = 0;  // Ensure XP doesn't go negative at the lowest level.
                break;
            }
            // Subtract the deficit from the XP requirement of the current level, then decrement the level.
            this.globalLevelXP += this.calculateXpForLevel(this.globalLevel);
            this.globalLevel--;
        }

        await this.save();  // Save changes.
    }


    async addServerXP(xp) {

        if (!this.serverUserLoaded) return;  // Ensure the server user is loaded before proceeding.
        if (!this.server || !this.server.hasPremium()) return;
        let didLevelUp = false;  // Flag to determine if a level-up event should be emitted.

        this.serverLevelXP += xp;  // Directly add XP to the current level XP.

        let xpNeededForNextLevel = this.calculateXpForLevel(this.serverLevel + 1);

        while (this.serverLevelXP >= xpNeededForNextLevel) {
            this.serverLevelXP -= xpNeededForNextLevel;  // Remove the XP needed for the next level, handling overflow.
            this.serverLevel++;  // Increment the level.

            // Re-calculate the XP needed for the next level after the level-up
            xpNeededForNextLevel = this.calculateXpForLevel(this.serverLevel + 1);

            didLevelUp = true;
        }

        await this.save();  // Save changes to the database.
        if (didLevelUp) {
            if (!this.serverUserLoaded) throw Error("Attempted to emit level up before loading server User");
            global.client.emit(Events.LevelUp, this, "server");
        }
    }


    async subtractServerXP(xp) {
        if (!this.server || !this.server.hasPremium()) return;
        if (!this.serverUserLoaded) return;
        if (this.serverLevel == 0 && this.serverLevelXP == 0) return;  // Avoid operation if no XP.
        let didLevelDown = false;  // Flag to determine if a level-down event should be emitted.
        this.serverLevelXP -= xp;
        while (this.serverLevelXP < 0) {
            if (this.serverLevel == 0) {
                this.serverLevelXP = 0;  // Ensure XP doesn't go negative at the lowest level.
                break;
            }
            // Subtract the deficit from the XP requirement of the current level, then decrement the level.
            this.serverLevelXP += this.calculateXpForLevel(this.serverLevel);
            this.serverLevel--;
            didLevelDown = true;
        }

        await this.save();  // Save changes.
        console.log("Will Level Down", didLevelDown)
        if (didLevelDown) global.client.emit(Events.LevelDown, this, "server");

    }



    /**
     * Counts the number of dares the user has done successfully
     */
    async daresDone(serverId) {
        const db = new Database();
        //use db.query(sql) to get the number of dares from user_dares where done_count >= 5
        let dares = await db.query(`SELECT COUNT(*) as count FROM user_dares WHERE user_id = ${this.id} AND done_count >= ${this.required_votes} ${serverId ? `AND server_id = ${serverId}` : ''}`);
        return dares[0].count;
    }

    /**
     * Counts the number of dares the user has failed
     */
    async daresFailed(serverId = false) {
        const db = new Database();
        //use db.query(sql) to get the number of dares from user_dares where failed_count >= 5
        let dares = await db.query(`SELECT COUNT(*) as count FROM user_dares WHERE user_id = ${this.id} AND failed_count >= ${this.required_votes} ${serverId ? `AND server_id = ${serverId}` : ''}`);
        return dares[0].count;
    }

    /**
     * Counts the number of truths the user has done successfully
     */
    async truthsDone(serverId = false) {
        const db = new Database();
        //use db.query(sql) to get the number of truths from user_truths where done_count >= 5
        let truths = await db.query(`SELECT COUNT(*) as count FROM user_truths WHERE user_id = ${this.id} AND done_count >= ${this.required_votes} ${serverId ? `AND server_id = ${serverId}` : ''}`);
        return truths[0].count;
    }

    /**
     * Counts the number of truths the user has failed
     */
    async truthsFailed(serverId = false) {
        const db = new Database();
        //use db.query(sql) to get the number of truths from user_truths where failed_count >= 5
        let truths = await db.query(`SELECT COUNT(*) AS count FROM user_truths WHERE user_id = ${this.id} AND failed_count >= ${this.required_votes} ${serverId ? `AND server_id = ${serverId}` : ''}`);
        return truths[0].count;
    }

    // Function to check if the last vote was within 24 hours
    hasValidVote() {
        return this.voteCount > 0;
    }

    async burnVote() {
        this.voteCount--;
        await this.save();
    }

    async addVote(count = 1) {
        if (this.voteCount == 10) return;

        this.voteCount += count;

        if (this.voteCount > 10) this.voteCount = 10;

        await this.save();
    }

    /**
     * Get a list of all the server IDs a user is currently associated with
     * @returns {Promise<string[]>} - A list of server IDs
     */
    async getServerList() {
        const db = new Database();

        // Query the server_users table to find all servers the user is linked to
        const results = await db.query(`
        SELECT server_id 
        FROM server_users 
        WHERE user_id = '${this.id}'
    `);

        // Extract the server IDs from the results
        const serverIds = results.map(row => row.server_id);

        return serverIds;
    }

    /**
    * Marks the user for deletion in 30 days if they are not banned and no longer in any servers.
    */
    async checkAndMarkForDeletion() {
        const db = new Database();
        const userInOtherServers = await db.query(`
            SELECT COUNT(*) as serverCount
            FROM server_users
            WHERE user_id = '${this.id}'
        `);

        if (userInOtherServers[0].serverCount === 0 && !this.isBanned) {
            const now = new Date();
            const deleteDate = new Date(now.setDate(now.getDate() + 30)).toISOString().split('T')[0];

            await db.query(`
                UPDATE users
                SET deleteDate = '${deleteDate}'
                WHERE id = '${this.id}'
            `);
        }
    }
}

module.exports = User