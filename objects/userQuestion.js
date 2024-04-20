const Database = require("./database");
const Question = require("./question");

class UserQuestion {
   id; // message_id
   userId;
   questionId;
   username;
   image;
   doneCount;
   failedCount;
   type;

   constructor(id, userId, questionId, username, image, doneCount, failedCount) {
      this.id = id;
      this.userId = userId;
      this.questionId = questionId;
      this.username = username;
      this.image = image;
      this.doneCount = doneCount;
      this.failedCount = failedCount;
   }

   getId() {
      return this.id;
   }

   getUserId() {
      return this.userId;
   }

   getUsername() {
      return this.username;
   }

   getQuestionId() {
      return this.questionId;
   }

   async getQuestion() {
      const db = new Database();
      return await db.get(this.getQuestionTable(), this.questionId)

   }

   getImage() {
      return this.image;
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

   async vote(userID, vote) {
      const db = new Database();
      const existingVote = await db.query(`SELECT * FROM user_vote WHERE user_id = ${userID} AND message_id = ${this.id}`);
      
      if (existingVote.length > 0) {
         return false;
      }
      if (vote === "done") {
         this.doneCount++;
      } else {
         this.failedCount++;
      }

      db.set("user_vote", {message_id: this.id, user_id: userID});
      this.save();
      return { done: this.doneCount, failed: this.failedCount };
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

   getQuestionTable() {
      switch (this.type) {
         case "dare":
            return "dares";
         case "truth":
            return "truths";
         default:
            throw new Error("Invalid Question type for UserQuestion object. Must be 'dare' or 'truth'. got: " + this.type);
      }
   }

   save() {
      const db = new Database();
      let tableSafe = {
         message_id: this.id,
         user_id: this.userId,
         question_id: this.questionId,
         username: this.username,
         image_url: this.image ?? '',
         done_count: this.doneCount,
         failed_count: this.failedCount
      }

      db.set(this.getTable(), tableSafe, "message_id");
   }

   /**
     * Use the message ID as the primary key for the UserDare object
     * It will be ID in the UserQuestion class and on the table
     * @param {*} messageId 
     */
   async load(messageId, type) {
      const db = new Database();
      if (!type) throw new Error("Type must be provided for UserQuestion load");
      this.type = type;
      let question = await db.get(this.getTable(), messageId, "message_id");

      this.id = question.message_id;
      this.userId = question.user_id;
      this.questionId = question.question_id;
      this.username = question.username;
      this.image = question.image_url;
      this.doneCount = question.done_count;
      this.failedCount = question.failed_count;


      return this;
   }

}

module.exports = UserQuestion;