const Question = require("./question");

class Truth extends Question {
    constructor(id = null) {
        super(id, "truth");
    }
}

module.exports = Truth;