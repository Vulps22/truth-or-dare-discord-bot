const Question = require("./question");

class Dare extends Question {
    constructor(id = null) {
        super(id, "dare");
    }
}

module.exports = Dare;