const Database = require('../objects/database');

class ConfigService {
    constructor() {
        this.db = new Database();
        this.config = null;
    }

    async loadConfig() {
        if (this.config) {
            return this.config;
        }

        try {
            const environmentKey = process.env.ENVIRONMENT_KEY;
            if (!environmentKey) {
                throw new Error('ENVIRONMENT_KEY is not set in the environment variables.');
            }

            const configData = await this.db.get('config', environmentKey);
            if (!configData) {
                throw new Error(`No configuration found for environment key: ${environmentKey}`);
            }
            this.config = configData;
            console.log('Configuration loaded successfully.');
            return this.config;
        } catch (error) {
            console.error('Failed to load configuration from database:', error);
            // Exit the process if config fails to load, as the bot cannot run without it.
            process.exit(1);
        }
    }

    get(key) {
        if (!this.config) {
            throw new Error('Configuration has not been loaded yet. Call loadConfig() first.');
        }
        if (key in this.config) {
            return this.config[key];
        }
        throw new Error(`Configuration key "${key}" not found.`);
    }
}

/**
 * Enum for configuration options.
 * @readonly
 * @enum {string}
 */
const ConfigOption = {
    MAINTENANCE_MODE: 'maintenance_mode',
    MAINTENANCE_REASON: 'maintenance_reason',
    DARES_LOG: 'dares_log',
    TRUTHS_LOG: 'truths_log',
    SERVERS_LOG: 'servers_log',
    REPORTS_LOG: 'reports_log',
    BANNED_USERS_LOG: 'banned_users_log',
    ERRORS_LOG: 'errors_log',
    ADVERT_CHANNEL: 'advertChannel',
    REQUIRED_VOTES: 'required_votes',
    ENVIRONMENT: 'environment',
    CLIENT_ID: 'client',
    CLIENT_SECRET: 'secret',
    GUILD_ID: 'guildId',
    LOGS_GUILD_ID: 'logs',
    TOP_GG_TOKEN: 'top_gg_token',
    TOP_GG_WEBHOOK_SECRET: 'top_gg_webhook_secret',
    ANNOUNCE_PASSWORD: 'announce_password',
    BOT_INVITE_URL: 'bot_invite_url',
    DISCORD_INVITE_CODE: 'discord_invite_code',
    ANNOUNCEMENT_CHANNEL_ID: 'announcementChannelId',
    UPDATE_CHANNEL_ID: 'updateChannelId',
};

const configServiceInstance = new ConfigService();

module.exports = configServiceInstance;
module.exports.ConfigOption = ConfigOption;
