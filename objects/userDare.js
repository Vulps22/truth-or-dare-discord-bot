const Database = require("./database");
const UserQuestion = require("./userQuestion");

class UserDare extends UserQuestion {

    constructor(messageId, userId, questionId) {
        super(messageId, userId, questionId, 0, 0);
        this.type = "dare";
    }


    /**
     * Use the message ID as the primary key for the UserDare object
     * It will be ID in the UserQuestion class and on the table
     * @param {*} messageId 
     */
    load(messageId) {
        const db = new Database();
        db.get(user_dares, messageId, "message_id").then((row) => {
            console.log(row);
            this.id = row.message_id;
            this.userId = row.user_id;
            this.questionId = row.dare_id;
            this.doneCount = row.done_count;
            this.failedCount = row.failed_count;
            this.type = "dare";
        });
    }

    getDareId() {
        return this.questionId;
    }
}

module.exports = UserDare;