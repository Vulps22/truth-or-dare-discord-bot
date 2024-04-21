const Database = require("./database");

class User {

    id;
    username;
    globalXP;
    isBanned;
    banReason;

    a = 0.0000156;
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
        const c = this.c // Adjust the constant term to account for y

        let x = ((-b*c) + Math.sqrt((b**2 * c**2) + (4*a*y)))/(2*a);
        
        return Math.floor(x);
    }


    async addXP(xp) {
        this.globalXP += xp;
        this.save();
    }

    async subtractXP(xp) {
        this.globalXP -= xp;
        this.save();
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