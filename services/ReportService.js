const Database = require('../objects/database');

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

const ReportType = {
    QUESTION: 'question',
    TRUTH: 'truth',
    DARE: 'dare',
    USER: 'user',
    SERVER: 'server'
};

module.exports = { ReportService, ReportStatus, ReportType };
