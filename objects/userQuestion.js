const User = require("./user");
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

   constructor(id, userId, questionId, serverId, username, image, doneCount, failedCount) {
      this.id = id;
      this.userId = userId;
      this.questionId = questionId;
      this.serverId = serverId;
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

   /**
    * 
    * @returns {Promise<User>}
    */
   async getUser() {
      const user = await new User(this.userId).get();
      return user;
   }

   /**
    * @returns {String}
    */
   getUsername() {
      return this.username;
   }

   /**
    * @returns {String}
    */
   getQuestionId() {
      return this.questionId;
   }

   /**
    * @returns {String}
    */
   getServerId() {
      return this.serverId;
   }

   async getQuestion() {
      const db = new Database();
      return await db.get('questions', this.questionId)

   }
   /**
 * @returns {String}
 */
   getImage() {
      return this.image;
   }
   /**
    * @returns {number}
    */
   getDoneCount() {
      return this.doneCount;
   }
   /**
    * @returns {number}
    */
   getFailedCount() {
      return this.failedCount;
   }

   incrementDoneCount() {
      this.doneCount++;
   }

   incrementFailedCount() {
      this.failedCount++;
   }

   /**
    * 
    * @param {string} userID 
    * @param {"done" | "fail"} vote 
    * @returns 
    */
   async vote(userID, vote) {
      const db = new Database();
      const existingVote = await db.query(`SELECT * FROM user_vote WHERE user_id = ${userID} AND message_id = ${this.id}`);

      if (existingVote.length > 0) {
         // return false;
      }
      if (vote === "done") {
         this.doneCount++;
      } else {
         this.failedCount++;
      }

      db.set("user_vote", { message_id: this.id, user_id: userID });
      this.save();
      return { done: this.doneCount, failed: this.failedCount };
   }
   /**
    * @deprecated use "user_questions" table instead
    * @returns "user_truths" | "user_dares"
    */
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

   /**
    * @deprecated Use 'questions' table instead
    * @returns "dares" | "truths"
    */
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
         messageId: this.id,
         userId: this.userId,
         serverId: this.serverId,
         questionId: this.questionId,
         username: this.username,
         imageUrl: this.image ?? '',
         doneCount: this.doneCount ?? 0,
         failedCount: this.failedCount ?? 0,
         type: this.type,
      };

      db.set('user_questions', tableSafe, "messageId");
   }

   /**
     * Use the message ID as the primary key for the UserDare object
     * It will be ID in the UserQuestion class and on the table
     * @param {string} messageId 
     * @param {"truth" | "dare"} type 
     */
   async load(messageId, type) {
      const db = new Database();
      if (!type) throw new Error("Type must be provided for UserQuestion load");
      this.type = type;
      let question = await db.get('user_questions', messageId, "messageId");
      this.id = question.messageId;
      this.userId = question.userId;
      this.questionId = question.questionId;
      this.serverId = question.serverId;
      this.username = question.username;
      this.image = question.imageUrl;
      this.doneCount = question.doneCount;
      this.failedCount = question.failedCount;


      return this;
   }

}

module.exports = UserQuestion;