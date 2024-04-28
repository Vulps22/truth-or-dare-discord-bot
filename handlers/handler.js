const Database = require('../objects/database.js');
const Question = require('../objects/question.js');

class Handler {
  db;
  constructor() {
    this.db = new Database();
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