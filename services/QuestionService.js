const Database = require('../objects/database');
const Question = require('../objects/question');

class QuestionService {
    constructor() {
        this.db = new Database();
    }

    /**
     * Fetch a question by its unique ID.
     * @param {number|string} id
     * @returns {Promise<Question|null>} The question object or null if not found.
     */
    async getQuestionById(id) {
        // Assuming 'questions' is the table and 'id' is the primary key
        const result = await this.db.get('questions', id, 'id');
        if (Array.isArray(result) && result.length > 0) {
            // If your DB returns an array, return the first item
            return result[0];
        }
        if (result) {
            // If your DB returns a single object
            return result;
        }
        return null;
    }

    /**
     * Ban a question by its ID and reason.
     * @param {number|string} questionId
     * @param {string} reason
     * @returns {Promise<boolean>} True if the question was banned successfully, false otherwise.
     */
    async banQuestion(questionId, reason, moderatorId) {
        try {

            const question = await this.getQuestionById(questionId);

            question.isBanned = true;
            question.banReason = reason;
            question.bannedBy = moderatorId;

            await this.db.set('questions', question, 'id');
            return true;
        } catch (error) {
            console.error('Error banning question:', error);
            return false;
        }
    }
}


const QuestionType = {
    TRUTH: 'truth',
    DARE: 'dare',
};

module.exports = { QuestionService, QuestionType };