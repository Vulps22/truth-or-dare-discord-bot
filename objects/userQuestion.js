const Database = require("./database");

class UserQuestion {
    id;
    userId;
    questionId;
    doneCount;
    failedCount;
    type;

    constructor(id, userId, questionId, doneCount, failedCount) {
        this.id = id;
        this.userId = userId;
        this.questionId = questionId;
        this.doneCount = doneCount;
        this.failedCount = failedCount;
    }

    getId() {
        return this.id;
    }

    getUserId() {
        return this.userId;
    }

    getQuestionId() {
        return this.questionId;
    }

    getDoneCount() {
        return this.doneCount;
    }

    getFailedCount() {
        return this.failedCount;
    }

    incrementDoneCount() {
        this.doneCount++;
    }

    incrementFailedCount() {
        this.failedCount++;
    }

    getTable() {
        switch (this.type) {
            case "dare":
                return "user_dares";
            case "truth":
                return "user_truths";
            default:
                throw new Error("Invalid Question type for UserQuestion object. Must be 'dare' or 'truth'. got: " + this.type);
        }
    }

    save() {
        const db = new Database();

        let tableSafe = {
            message_id: this.id,
            user_id: this.userId,
            dare_id: this.questionId,
            done_count: this.doneCount,
            failed_count: this.failedCount
        }

        db.set(this.getTable(), tableSafe).then(() => {
            console.log("UserQuestion saved");
        });
    }

}

module.exports = UserQuestion;