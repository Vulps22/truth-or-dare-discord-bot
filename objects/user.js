const Database = require("./database");

class User {

    id;
    username;
    globalXP;
    isBanned;
    banReason;

    constructor(id, username) {
        this.id = id;
        this.username = username;
        this.globalXP = 0;
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
        db.set('users', { id: this.id, username: this.username, global_xp: this.globalXP, is_banned: this.isBanned, ban_reason: this.banReason });
    }

    /**
     * Loads the user's data from the database
     * Should only be used within the class constructor
     * @returns {boolean} Whether the user was successfully loaded
     */
    async load() {
        console.log(`Loading user ${this.id}`);
        const db = new Database();
        let user = await db.get('users', this.id)

        if (!user) return false;
        
        this.username = user.username;
        this.globalXP = user.global_xp;
        this.isBanned = user.is_banned;
        this.banReason = user.ban_reason;
        return true;
    }
}

module.exports = User