const Database = require("./database");
const UserQuestion = require("./userQuestion");

class UserTruth extends UserQuestion {

    constructor(messageId, userId, questionId, username, image) {
        super(messageId, userId, questionId, username, image, 0, 0);
        this.type = "truth";
    }

    getTruthId() {
        return this.questionId;
    }

}

module.exports = UserTruth;