const { MessageFlags } = require('discord.js');
const Database = require('../objects/database');
const { ReportView } = require('../views/moderation/reportView');

class ReportService {
    constructor() {
        this.db = new Database();
    }

    /**
     * Gets the moderator channel ID from configuration.
     * @private
     */
    get moderatorChannelId() {
        // Use global.my which is set in bot.js from the passed config
        return global.my.reports_log;
    }

    /**
     * Creates a new report and saves it to the database.
     * @param {object} reportData - The data for the report.
     * @param {string} reportData.type - The type of report ('truth', 'dare', 'server').
     * @param {string} reportData.reporterId - The ID of the user making the report.
     * @param {string} reportData.offenderId - The ID of the item being reported (question or server).
     * @param {string} reportData.reason - The reason for the report.
     * @param {string} reportData.serverId - The ID of the server where the report was made.
     * @returns {Promise<object|null>} The created report object from the database, or null if failed.
     */
    async createReport({ type, reporterId, offenderId, reason, serverId }) {
        try {
            const reportToSave = {
                type,
                reason,
                status: 'pending',
                senderId: reporterId,
                offenderId,
                serverId,
            };

            const reportId = await this.db.set('reports', reportToSave);

            if (reportId) {
                return await this.db.get('reports', reportId);
            }
            return null;
        } catch (error) {
            console.error('Error creating report:', error);
            // In a real scenario, we'd have more robust error logging (e.g., Sentry, Winston)
            throw new Error('Failed to create report in database.');
        }
    }

    async updateReport(report) {
        try {
            await this.db.set('reports', report);
        } catch (error) {
            console.error('Error updating report:', error);
            throw new Error('Failed to update report in database.');
        }
    }

    /**
     * Notifies moderators about a new report.
     * @param {object} report - The report object from the database.
     * @param {import('discord.js').Client} client - The Discord client instance.
     */
    async notifyModerators(report, client) {
        try {
            const channel = await client.channels.fetch(this.moderatorChannelId);
            if (!channel) {
                console.error(`Moderator channel with ID ${this.moderatorChannelId} not found.`);
                return;
            }

            // TODO: Add buttons for actions (e.g., Ban User, Ban Question, Clear Report)

            await channel.send({ components: ReportView(report), flags: MessageFlags.IsComponentsV2 });
        } catch (error) {
            console.error('Failed to send report notification to moderators:', error);
            throw new Error('Failed to notify moderators.');
        }
    }

    /**
     * Fetch a report by its unique ID
     * @param {number|string} id
     * @returns {Promise<Object|null>} The report object or null if not found
     */
    async getReportById(id) {
        const results = await this.db.get('reports', id, 'id');
        console.log(`Fetched report with ID ${id}:`, results);
        if (results !== undefined) {
            return results;
        }
        return null;
    }
}

const ReportStatus = {
    PENDING: 'pending',
    ACTIONING: 'actioning',
    ACTIONED: 'actioned',
    CLEARED: 'cleared'
};

module.exports = { ReportService, ReportStatus };
