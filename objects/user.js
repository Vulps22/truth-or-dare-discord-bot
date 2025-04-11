const MustNotDeleteUsersError = require("errors/mustNotDeleteUsersError");
const Events = require("events/Events");
const Database = require("objects/database");
const Server = require("objects/server");

class User {

    id;
    username;
    isBanned;
    banReason;
    voteCount;

    rulesAccepted = false;

    globalLevel = 0;
    globalLevelXp = 0;


    _levelRandomiser = 1.254;
    _levelMultiplier = 100;

    _required_votes;

    ban_message_id;

    deleteDate;

    _loaded = false;

    _serverId;

    _truths = {
        done: 0,
        failed: 0,
    }

    _dares = {
        done: 0,
        failed: 0,
    }

    _useDoneObjects = false;

    /** @type {Server} */
    _server;
    _serverUserLoaded = false;
    _serverLevel;
    _serverLevelXp;


    constructor(id, username) {
        this.id = id;
        this.username = username;
        this.globalLevel = 0;
        this.globalLevelXp = 0;
        this._serverLevel = 0;
        this._serverLevelXp = 0;
        this.isBanned = false;
        this.banReason = '';
        this._required_votes = my.required_votes;
        this.voteCount = 0;
        this.deleteDate = null;
    }
    /**
     * Load the user from the database or create a new one if none exist with the specified ID
     * @returns {Promise<User>}
     */
    async get() {
        const didLoad = await this.load()
        if (!didLoad) {
            if (!this.username) return false;
            return this.save().then(() => this);
        }
        return this;
    }

    /**
     * Saves the user's data to the database
     */
    async save() {
        const db = new Database();

        // Create an object dynamically containing all the properties of the user instance
        let userData = {};

        for (let key in this) {
            // Skip private properties and functions
            if (typeof this[key] === 'function' || key.startsWith('_')) continue;
            userData[key] = this[key];
        }

        if (my.environment == 'dev') userData['isBanned'] = 0;
        // Save the userData to the database
        await db.set('users', userData);

        // Save server-specific user data if loaded
        if (this._serverUserLoaded) await this.saveServerUser();
    }


    /**
     * Loads the user's data from the database without creating a new record if an existing record does not exist
     * 
     * @returns {boolean} Whether the user was successfully loaded
     */
    async load() {

        const db = new Database();
        let user = await db.get('users', this.id)

        if (!user) return false;

        this.username = user.username;
        this.globalLevel = user.globalLevel;
        this.globalLevelXp = user.globalLevelXp;
        this.rulesAccepted = user.rulesAccepted;
        this.isBanned = user.isBanned;
        this.banReason = user.banReason;
        this.voteCount = user.voteCount;
        this.ban_message_id = user.ban_message_id;
        this.deleteDate = user.deleteDate;
        this._loaded = true;
        return true;
    }

    async loadServerUser(serverId, orCreate = false) {
        if(!serverId) return false;
        const db = new Database();
        const query = `SELECT * FROM server_users WHERE user_id = ${this.id} AND server_id = ${serverId}`;
        let serverUserRaw = await db.query(query);
        let serverUser = serverUserRaw[0];

        if (!serverUser) {
            if (orCreate) {
                await this.addServerUser(serverId);
                this._serverUserLoaded = true;
            }
            return false;
        }

        this._serverId = serverUser.server_id;
        this._serverLevel = serverUser.server_level;
        this._serverLevelXp = serverUser.server_level_xp;

        this._server = new Server(serverId);
        await this._server.load();

        this._serverUserLoaded = true;
        return true;
    }

    async addServerUser(serverId) {
        const db = new Database();
        await db.set('server_users', { user_id: this.id, server_id: serverId, server_level: 0, server_level_xp: 0 });
        this._serverId = serverId;
        this._serverLevel = 0;
        this._serverLevelXp = 0;
        this._serverUserLoaded = true;
        this._server = new Server(serverId);
        await this._server.load();
    }

    async saveServerUser() {
        if (!this._serverUserLoaded) return;
        const db = new Database();
        await db.query(`UPDATE server_users SET server_level = ${this._serverLevel}, server_level_xp = ${this._serverLevelXp} WHERE user_id = ${this.id} AND server_id = ${this._serverId}`);
    }

    /**
     * Remove the server_users record for linking this user to the specified serverId. Mark the user to be deleted if they are not registered with any more servers.
     * @param {string} serverId 
     * @returns 
     */
    async deleteServerUser(serverId) {
        const didLoad = this.loadServerUser(serverId);

        if (!didLoad) return false;
        const db = new Database();
        db.query(`DELETE FROM server_users WHERE server_id = '${serverId}' && user_id = '${this.id}'`);

        const servers = await this.getServerList();

        if (await servers.length > 0) {
            return false;
        }

        this.markForDeletion();
        const logger = require('logger');
        logger.log(`**User** ${this.id} is no longer using the bot and Will be deleted in 30 days...`)
        return true;
    }

    /**
     * Creates a User instance from a plain object without needing to reload from the database.
     * @param {object} data - The object containing user data.
     * @returns {User} The instantiated User object.
     * @deprecated Use userFromObject instead
     */
    static fromObject(data) {
        const user = new User(data.id, data.username);
        user.globalLevel = data.global_level;
        user.globalLevelXp = data.global_level_xp;
        user.rulesAccepted = data.rulesAccepted;
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
     * @deprecated Use _serverLevel instead
     * @returns {number} The user's global level
     */
    getServerLevel() {
        return this._serverLevel;
    }

    /**
     * 
     * @deprecated use the globalLevel or _serverLevel properties instead
     * @param {number} xp 
     * @returns {number} The user's level with the sapecified xp
     */
    calculateLevel(xp) {
        let level = (xp / this._levelRandomiser) / this._levelMultiplier;
        return Math.floor(level)
    }

    calculateXpForLevel(level) {
        let xp = level * this._levelMultiplier * this._levelRandomiser;
        return Math.ceil(xp);
    }

    getTotalGlobalXP() {
        let totalXP = 0;

        // Sum XP required for all levels up to the current level
        for (let level = 1; level <= this.globalLevel; level++) {
            totalXP += this.calculateXpForLevel(level);
        }

        // Add the XP gained in the current level
        totalXP += this.globalLevelXp;
        return totalXP;
    }

    getTotalServerXP() {
        if (!this._serverUserLoaded) return 0;

        let totalXP = 0;

        // Sum XP required for all server levels up to the current level
        for (let level = 1; level <= this._serverLevel; level++) {
            totalXP += this.calculateXpForLevel(level);
        }

        // Add the XP gained in the current server level
        totalXP += this._serverLevelXp;

        return totalXP;
    }


    willLevelUpGlobally(xpChange) {
        let currentLevel = this.globalLevel;
        let newXp = this.globalLevelXp + xpChange;
        let xpForNextLevel = this.calculateXpForLevel(currentLevel + 1);
        return newXp >= xpForNextLevel;
    }

    willLevelUpServerly(xpChange) {
        let currentLevel = this._serverLevel;
        let newXp = this._serverLevelXp + xpChange;
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


    /**
     * 
     * @param {number} xp 
     * @param {import("node_modules/discord.js").Interaction} interaction If interaction is provided, it will be used to emit the level up event
     */
    async addXP(xp, interaction = null) {
        if (this._loaded) await this.load();
        let didLevelUp = false;  // Flag to determine if a level-up event should be emitted.

        this.globalLevelXp += xp;  // Directly add XP to the current level XP.

        let xpNeededForNextLevel = this.calculateXpForLevel(this.globalLevel + 1);

        while (this.globalLevelXp >= xpNeededForNextLevel) {
            this.globalLevelXp -= xpNeededForNextLevel;  // Remove the XP needed for the next level, handling overflow.
            this.globalLevel++;  // Increment the level.

            // Re-calculate the XP needed for the next level after the level-up
            xpNeededForNextLevel = this.calculateXpForLevel(this.globalLevel + 1);

            didLevelUp = true;
        }

        if (didLevelUp && interaction) {
            global.client.emit(Events.LevelUp, this, "global", interaction);
        }


        await this.save();  // Save changes to the database.
    }


    async subtractXP(xp) {
        if (this.globalLevel == 0 && this.globalLevelXp == 0) return;  // Avoid operation if no XP.

        this.globalLevelXp -= xp;
        while (this.globalLevelXp < 0) {
            if (this.globalLevel == 0) {
                this.globalLevelXp = 0;  // Ensure XP doesn't go negative at the lowest level.
                break;
            }
            // Subtract the deficit from the XP requirement of the current level, then decrement the level.
            this.globalLevelXp += this.calculateXpForLevel(this.globalLevel);
            this.globalLevel--;
        }

        await this.save();  // Save changes.
    }


    /**
     * 
     * @param {number} xp 
     * @param {import("node_modules/discord.js").Interaction} interaction 
     * @returns 
     */
    async addServerXP(xp, interaction = null) {

        if (!this._serverUserLoaded) return;  // Ensure the server user is loaded before proceeding.
        if (!this._server || !this._server.hasPremium()) return;
        let didLevelUp = false;  // Flag to determine if a level-up event should be emitted.

        this._serverLevelXp += xp;  // Directly add XP to the current level XP.

        let xpNeededForNextLevel = this.calculateXpForLevel(this._serverLevel + 1);

        while (this._serverLevelXp >= xpNeededForNextLevel) {
            this._serverLevelXp -= xpNeededForNextLevel;  // Remove the XP needed for the next level, handling overflow.
            this._serverLevel++;  // Increment the level.

            // Re-calculate the XP needed for the next level after the level-up
            xpNeededForNextLevel = this.calculateXpForLevel(this._serverLevel + 1);

            didLevelUp = true;
        }

        await this.save();  // Save changes to the database.
        if (didLevelUp && interaction) {
            if (!this._serverUserLoaded) throw Error("Attempted to emit level up before loading server User");
            global.client.emit(Events.LevelUp, this, "server", interaction);
        }
    }


    async subtractServerXP(xp) {
        if (!this._server || !this._server.hasPremium()) return;
        if (!this._serverUserLoaded) return;
        if (this._serverLevel == 0 && this._serverLevelXp == 0) return;  // Avoid operation if no XP.
        let didLevelDown = false;  // Flag to determine if a level-down event should be emitted.
        this._serverLevelXp -= xp;
        while (this._serverLevelXp < 0) {
            if (this._serverLevel == 0) {
                this._serverLevelXp = 0;  // Ensure XP doesn't go negative at the lowest level.
                break;
            }
            // Subtract the deficit from the XP requirement of the current level, then decrement the level.
            this._serverLevelXp += this.calculateXpForLevel(this._serverLevel);
            this._serverLevel--;
            didLevelDown = true;
        }

        await this.save();  // Save changes.
        if (didLevelDown) global.client.emit(Events.LevelDown, this, "server");

    }



    /**
     * Counts the number of dares the user has done successfully
     */
    async daresDone(serverId) {
        if (!this._useDoneObjects) {

            const db = new Database();
            //use db.query(sql) to get the number of dares from user_questions where type = dare AND done_count >= 5
            let dares = await db.query(`SELECT COUNT(*) as count FROM user_questions WHERE userId = ${this.id} AND type = 'dare' AND doneCount >= ${this._required_votes} ${serverId ? `AND serverId = ${serverId}` : ''}`);
            return dares[0].count;
        }
        return this._dares.done;
    }

    /**
     * Counts the number of dares the user has failed
     */
    async daresFailed(serverId = false) {
        if (!this._useDoneObjects) {
            const db = new Database();
            //use db.query(sql) to get the number of dares from user_questions where type = dare AND failedCount >= 5
            let dares = await db.query(`SELECT COUNT(*) as count FROM user_questions WHERE userId = ${this.id} AND type = 'dare' AND failedCount >= ${this._required_votes} ${serverId ? `AND serverId = ${serverId}` : ''}`);
            return dares[0].count;
        }
        return this._dares.failed;
    }

    /**
     * Counts the number of truths the user has done successfully
     */
    async truthsDone(serverId = false) {
        if (!this._useDoneObjects) {
            const db = new Database();
            //use db.query(sql) to get the number of truths from user_questions where type = truth AND done_count >= 5
            let truths = await db.query(`SELECT COUNT(*) as count FROM user_questions WHERE userId = ${this.id} AND type = 'truth' AND doneCount >= ${this._required_votes} ${serverId ? `AND serverId = ${serverId}` : ''}`);
            return truths[0].count;
        }

        return this._truths.done;
    }

    /**
     * Counts the number of truths the user has failed
     */
    async truthsFailed(serverId = false) {
        if (!this._useDoneObjects) {
            const db = new Database();
            //use db.query(sql) to get the number of truths from user_questions where type = truth AND failed_count >= 5
            let truths = await db.query(`SELECT COUNT(*) AS count FROM user_questions WHERE userId = ${this.id} AND type = 'truth' AND failedCount >= ${this._required_votes} ${serverId ? `AND serverId = ${serverId}` : ''}`);
            return truths[0].count;
        }

        return this._truths.failed;
    }

    // Function to check if the last vote was within 24 hours
    hasValidVote() {
        return this.voteCount > 0;
    }

    async burnVote() {
        this.voteCount--;
        await this.save();
    }

    /**
     * Add a vote (aka 'skip') to the user's vote count. use force = true to bypass the 10 vote limit (e.g. when a one time purchase is made)
     * @param {number} count 
     * @param {boolean} force 
     * @returns 
     */
    async addVote(count = 1, force = false) {
        if (!force && this.voteCount == 10) return;

        this.voteCount += count;

        if (this.voteCount > 10 && !force) this.voteCount = 10;

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
    * Marks the user for deletion in 30 days
    * THIS FUNCTION HAS BEEN DISABLED AND WILL THROW AN ERROR IF CALLED
    * @throws {MustNotDeleteUsersError} - This error is thrown to prevent user deletion
    */
    async markForDeletion() {

        const now = new Date();
        const deleteDate = new Date(now.setDate(now.getDate() + 30)).toISOString().split('T')[0];

        const db = new Database();

        await db.query(`
                UPDATE users
                SET deleteDate = '${deleteDate}'
                WHERE id = '${this.id}'
            `);
    }

    /**
     * Can the user create truths/dares?
     */
    async canCreate() {
        if (!this._loaded) await this.get();
        return this.rulesAccepted;
    }
}

module.exports = User