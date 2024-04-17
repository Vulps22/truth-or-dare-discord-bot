const Database = require("./database");

class user {

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
        
        if(!this.load()) this.save();
    }

    /**
     * Saves the user's data to the database
     */
    save() {
        db = new Database();
        db.set('users', {id: this.id, username: this.username, globalXP: this.globalXP, is_banned: this.isBanned, ban_reason: this.banReason});
    }

    /**
     * Loads the user's data from the database
     * Should only be used within the class constructor
     * @returns {boolean} Whether the user was successfully loaded
     */
    load() {
        db = new Database();
        let user = db.get('users', this.id);
        if(!user) return false;
        this.username = user.username;
        this.globalXP = user.globalXP;
        this.isBanned = user.is_banned;
        this.banReason = user.ban_reason;
        return true;
    }

}

module.exports = user