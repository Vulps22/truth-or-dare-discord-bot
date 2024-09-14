function applyGlobals() {
    /** @type {Config} */
    global.my = {
        id: 3, // Primary key, INT, auto-increment
        maintenance_mode: false, // TINYINT(1) - assuming 0 means false and 1 means true
        maintenance_reason: null, // LONGTEXT, can store the reason for maintenance
        dares_log: 'dare_log', // VARCHAR(20), log for dares
        truths_log: 'truth_log', // VARCHAR(20), log for truths
        servers_log: 'server_log', // VARCHAR(20), log for servers
        banned_users_log: 'banned_user_log', // VARCHAR(20), log for banned users
        required_votes: 3, // INT, default is 3
        environment: 'test', // ENUM('prod', 'stage', 'dev'), default is 'dev'
        client: 'client_id', // VARCHAR(20), client info
        secret: 'bot_secret', // VARCHAR(20), secret value
        guildId: 'guild_id', // VARCHAR(90), guild ID (longer VARCHAR)
        errors_log: 'error_log', // VARCHAR(20), log for errors
        logs: 'log_channel', // VARCHAR(20), general logs
        top_gg_webhook_secret: 'top_gg_secret', // VARCHAR(90), top.gg webhook secret
        announce_password: 'announcer_password' // VARCHAR(90), password for announcements
    };
}

module.exports = { applyGlobals };
