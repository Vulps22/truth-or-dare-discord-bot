const Question = require("objects/question");

class Dare extends Question {
    constructor(id = null) {
        super(id, "dare");
    }
}

module.exports = Dare;