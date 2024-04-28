
const Database = require('../objects/database.js');
const Question = require('../objects/question.js');

class Handler {
  db;

  vote_count = 3;
  ALPHA = false;

  constructor() {
    this.db = new Database();
    const ALPHA = process.env['ALPHA'] ?? false;

    if(ALPHA) {
      this.ALPHA = true;
      this.vote_count = 1;
    }
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