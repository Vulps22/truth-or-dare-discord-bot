const Database = require("@replit/database");
const Question = require('./question.js');

class Handler {
  constructor() {
    this.db = new Database();
    this.Question = Question;
  }

  async getQuestions(key) {
    const questions = await this.db.get(key);
    return questions || [];
  }

  async addQuestion(key, question) {
    const questions = await this.getQuestions(key);
    questions.push(question);
    await this.db.set(key, questions);
  }
}


module.exports = Handler