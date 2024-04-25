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

    async setLevelRole(roleId, level) {
        let role = await this.getLevelRole(level) // check if role already exists
        if(role) {
            // update role
            const db = new Database();
            await db.query(`UPDATE server_level_roles SET role_id = '${roleId}' WHERE server_id = '${this.id}' AND level = ${level}`);
        } else {
            // add role
            const db = new Database();
            await db.query(`INSERT INTO server_level_roles (server_id, role_id, level) VALUES ('${this.id}', '${roleId}', ${level})`);
        }
    }

    async getLevelRole(level) {
        // Get the role for a specific level
        const db = new Database();
    
        // Adjusted query to get the highest level less than or equal to the given level
        const query = `
            SELECT role_id 
            FROM server_level_roles 
            WHERE server_id = '${this.id}' AND level <= ${level}
            ORDER BY level DESC
            LIMIT 1
        `;
    
        const results = await db.query(query);
        if (results.length > 0) {
            return results[0].role_id;  // Assuming the query returns at least one result
        } else {
            return null;  // No roles found for this level or below
        }
    }
    

}

module.exports = Server;