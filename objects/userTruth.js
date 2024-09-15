const Database = require("objects/database");
const UserQuestion = require("objects/userQuestion");

class UserTruth extends UserQuestion {

    constructor(messageId, userId, questionId, serverId, username, image) {
        super(messageId, userId, questionId, serverId, username, image, 0, 0);
        this.type = "truth";
    }

    getTruthId() {
        return this.questionId;
    }

}

module.exports = UserTruth;