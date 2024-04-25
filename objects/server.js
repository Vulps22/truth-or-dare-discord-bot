const Database = require("./database");

class Server {
    
    id;
    name;
    hasAccepted;
    isBanned;
    banReason;
    level_up_channel;

    date_created;
    date_updated;

    dare_success_xp;
    dare_fail_xp;

    truth_success_xp;
    truth_fail_xp;

    constructor(id) {
        this.id = id;
    }


    async load() {
        // load server from database
        const db = new Database();
        let serverData = await db.get("servers", this.id);

        if(!serverData) return;

        this.name = serverData.name;
        this.hasAccepted = serverData.hasAccepted;
        this.isBanned = serverData.isBanned;
        this.banReason = serverData.banReason;
        this.date_created = serverData.date_created;
        this.date_updated = serverData.date_updated;
        this.dare_success_xp = serverData.dare_success_xp;
        this.dare_fail_xp = serverData.dare_fail_xp;
        this.truth_success_xp = serverData.truth_success_xp;
        this.truth_fail_xp = serverData.truth_fail_xp;
        this.level_up_channel = serverData.level_up_channel;
    }

    save() {
        // save server to database
        const db = new Database();
        db.set("servers", this);
    }


}

module.exports = Server;