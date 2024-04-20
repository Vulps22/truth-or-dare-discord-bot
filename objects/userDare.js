const Database = require("./database");
const UserQuestion = require("./userQuestion");

class UserDare extends UserQuestion {

    constructor(messageId, userId, questionId, username, image) {
        super(messageId, userId, questionId, username, image, 0, 0);
        this.type = "dare";
    }

    getDareId() {
        return this.questionId;
    }

}

module.exports = UserDare;