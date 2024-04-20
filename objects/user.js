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

        const db = new Database();
        let user = await db.get('users', this.id)

        if (!user) return false;

        this.username = user.username;
        this.globalXP = user.global_xp;
        this.isBanned = user.is_banned;
        this.banReason = user.ban_reason;
        return true;
    }

    getLevel() {
        return this.calculateLevel(this.globalXP);
    }

    calculateLevel(xp) {
        // Coefficients for the quadratic equation ax^2 + bx + c = 0
        const a = 5;
        const b = 50;
        const c = 100 - xp;

        // Calculate the discriminant
        const discriminant = b * b - 4 * a * c;

        // If discriminant is negative, no solution exists
        if (discriminant < 0) {
            return -1; // Or handle it the way you'd like, maybe return 0 indicating level can't be calculated
        }

        // Calculate the level, only the positive root makes sense
        const level = (-b + Math.sqrt(discriminant)) / (2 * a);

        // Since level cannot be fractional, we take the floor of the level value
        return Math.floor(level);
    }

    calculateXpForLevel(level) {
        return 100 + (55 * (level - 1)) + (10 * ((level - 2) * (level - 1)) / 2);
    }

    async addXP(xp) {
        this.globalXP += xp;
        this.save();
    }

    async subtractXP(xp) {
        this.globalXP -= xp;
        this.save();
    }



}

module.exports = User