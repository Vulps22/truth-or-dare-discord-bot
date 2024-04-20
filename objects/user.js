const Database = require("./database");

class User {

    id;
    username;
    globalXP;
    isBanned;
    banReason;

    a = 0.0000356;
    b = 0;
    c = 0.2;

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

    calculateLevel(x) {

        const a = this.a; // Make sure a is not 0
        const b = this.b;
        const c = this.c;

        let y = (a * x ** 2 + b * x + c);
        return Math.ceil(y);
    }

    calculateXpForLevel(y) {
        const a = this.a;
        const b = this.b;
        const c = this.c - y; // Adjust the constant term to account for y

        // Calculate the term under the square root
        const sqrtTerm = (b * b - 4 * a * c);
    
        // Check if the square root term is non-negative
        if (sqrtTerm < 0) {
            throw new Error("No real solutions exist for the given inputs.");
        }
    
        // Calculate the potential roots
        const sqrtValue = Math.sqrt(sqrtTerm);
        const x1 = (-b + sqrtValue) / (2 * a);
    
        return Math.floor(x1);
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