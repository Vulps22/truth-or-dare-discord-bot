const Database = require("./database");
const UserQuestion = require("./userQuestion");

class UserDare extends UserQuestion {

    constructor(messageId, userId, questionId, username, image) {
        super(messageId, userId, questionId, username, image, 0, 0);
        this.type = "dare";
    }


    /**
     * Use the message ID as the primary key for the UserDare object
     * It will be ID in the UserQuestion class and on the table
     * @param {*} messageId 
     */
    async load(messageId) {
        console.log("loading dare", messageId)
        const db = new Database();
        let dare = await db.get('user_dares', messageId, "message_id");
        console.log("dare", dare);
        this.id = dare.message_id;
        this.userId = dare.user_id;
        this.questionId = dare.dare_id;
        this.username = dare.username;
        this.image = dare.image_url;
        this.doneCount = dare.done_count;
        this.failedCount = dare.failed_count;
        this.type = "dare";
        return this;
    }

    getDareId() {
        return this.questionId;
    }

}

module.exports = UserDare;