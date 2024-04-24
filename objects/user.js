const Database = require("./database");

class User {

    id;
    serverId;
    username;
    isBanned;
    banReason;

    globalXP;
    globalLevelXP;

    serverXP;
    serverLevelXP;

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
        await db.set('users', { id: this.id, username: this.username, global_xp: this.globalXP, global_level_xp: this.globalLevelXP, is_banned: this.isBanned, ban_reason: this.banReason });
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
        this.globalLevelXP = user.global_level_xp;
        this.isBanned = user.is_banned;
        this.banReason = user.ban_reason;
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
            return;
        }
        this.serverId = serverUser.server_id;
        this.serverXP = serverUser.server_xp;
        this.serverLevelXP = serverUser.server_level_xp;
        this.serverUserLoaded = true;

    }

    async addServerUser(serverId) {
        const db = new Database();
        await db.set('server_users', { user_id: this.id, server_id: serverId, server_xp: 0, server_level_xp: 0 });
        this.serverUserLoaded = true;
    }

    async saveServerUser() {
        console.log("saving server user");
        if (!this.serverUserLoaded) return;
        const db = new Database();
        await db.query(`UPDATE server_users SET server_xp = ${this.serverXP}, server_level_xp = ${this.serverLevelXP} WHERE user_id = ${this.id} AND server_id = ${this.serverId}`);
    }

    getLevel() {
        return this.calculateLevel(this.globalXP);
    }

    getServerLevel() {
        return this.calculateLevel(this.serverXP);
    }

    calculateLevel(xp) {
        let level = (xp / this.levelRandomiser) / this.levelMultiplier;
        return Math.floor(level)
    }

    calculateXpForLevel(level) {
        let xp = level * this.levelMultiplier * this.levelRandomiser;
        return Math.ceil(xp);
    }

    willLevelUpGlobally(xpChange) {
        let currentLevel = this.getLevel();
        let newXp = this.globalLevelXP + xpChange;
        let xpForNextLevel = this.calculateXpForLevel(currentLevel + 1);
        return newXp >= xpForNextLevel;
    }

    willLevelDownGlobally(xpChange) {
        let newXp = this.globalLevelXP + xpChange;
        return newXp < 0;
    }

    willLevelUpServerly(xpChange) {
        let currentLevel = this.getServerLevel();
        let newXp = this.serverLevelXP + xpChange;
        let xpForNextLevel = this.calculateXpForLevel(currentLevel + 1);
        return newXp >= xpForNextLevel;
    }

    willLevelDownServerly(xpChange) {
        let newXp = this.serverLevelXP + xpChange;
        return newXp < 0;
    }



    async addXP(xp) {
        let shouldLevelUp = this.willLevelUpGlobally(xp);

        if (!shouldLevelUp) this.globalLevelXP += xp;
        else {
            console.log("level up!");
            let currentLevel = this.getLevel();
            let xpNeededForNextLevel = this.calculateXpForLevel(currentLevel + 1);
            let totalXPAfterAddition = this.globalXP + xp;
            let remainingXpFromLevel = totalXPAfterAddition - xpNeededForNextLevel;

            this.globalLevelXP = remainingXpFromLevel;
            console.log("Remaining XP: " + remainingXpFromLevel);
        }
        this.globalXP += xp;
        //TODO: LEVEL UP! notification
        this.save();
    }

    async subtractXP(xp) {
        if (this.globalXP == 0) return;  // Avoids operation if no XP.

        let totalXPAfterSubtraction = this.globalXP - xp;
        if (totalXPAfterSubtraction < 0) {
            totalXPAfterSubtraction = 0;  // Prevents negative XP totals.
        }

        let currentLevel = this.getLevel();
        let xpNeededForCurrentLevel = this.calculateXpForLevel(currentLevel);

        if (totalXPAfterSubtraction < xpNeededForCurrentLevel) {
            // Calculate how much the new total XP is below the threshold.
            let deficit = xpNeededForCurrentLevel - totalXPAfterSubtraction;

            // Set globalLevelXP to the threshold minus the deficit.
            this.globalLevelXP = xpNeededForCurrentLevel - deficit;
        } else {
            // Simply subtract XP from globalLevelXP if above threshold.
            this.globalLevelXP -= xp;
        }

        this.globalXP = totalXPAfterSubtraction;  // Update total XP.
        this.save();  // Save changes.
    }



    async addServerXP(xp) {
        let shouldLevelUp = this.willLevelUpServerly(xp);

        if (!shouldLevelUp) {
            // Simply add XP if no level up is required.
            this.serverLevelXP += xp;
        } else {
            // Handle leveling up.
            console.log("Server level up!");
            let currentLevel = this.getServerLevel();
            let xpNeededForNextLevel = this.calculateXpForLevel(currentLevel + 1);
            let totalXPAfterAddition = this.serverXP + xp;
            let remainingXpFromLevel = totalXPAfterAddition - xpNeededForNextLevel;

            // Set the overflow XP as the new starting XP for the next level.
            this.serverLevelXP = remainingXpFromLevel;
            console.log("Remaining Server XP: " + remainingXpFromLevel);
        }

        // Always update the total server XP.
        this.serverXP += xp;

        // Save the changes to the server-specific user profile.
        this.saveServerUser(this.serverId);
    }


    async subtractServerXP(xp) {
        if (this.serverXP == 0) return;  // Avoid operation if no server XP.
    
        let totalServerXPAfterSubtraction = this.serverXP - xp;
        if (totalServerXPAfterSubtraction < 0) {
            totalServerXPAfterSubtraction = 0;  // Prevent negative server XP totals.
        }
    
        let currentServerLevel = this.getServerLevel();
        let xpNeededForCurrentServerLevel = this.calculateXpForLevel(currentServerLevel);
    
        if (totalServerXPAfterSubtraction < xpNeededForCurrentServerLevel) {
            // Check if there will be a server level down.
            if (this.willLevelDownServerly(-xp)) {
                console.log("Server level down!");
                // Adjust the server level accordingly.
                this.adjustServerLevelDown();
            }
    
            // Calculate how much the new total server XP is below the threshold.
            let deficit = xpNeededForCurrentServerLevel - totalServerXPAfterSubtraction;
    
            // Set serverLevelXP to the threshold minus the deficit.
            this.serverLevelXP = xpNeededForCurrentServerLevel - deficit;
        } else {
            // Simply subtract XP from serverLevelXP if above threshold.
            this.serverLevelXP -= xp;
        }
    
        this.serverXP = totalServerXPAfterSubtraction;  // Update total server XP.
        this.saveServerUser(this.serverId);  // Save changes to server-specific user profile.
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