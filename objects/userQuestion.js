const Database = require("./database");
const Question = require("./question");

class UserQuestion {
   id;
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
      console.log("image", image);
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
      console.log("getting question", this.questionId);
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

   vote(userID, vote) {
      if (vote === "done") {
         this.doneCount++;
      } else {
         this.failedCount++;
      }
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
      console.log("image", this.image);
      let tableSafe = {
         message_id: this.id,
         user_id: this.userId,
         dare_id: this.questionId,
         username: this.username,
         image_url: this.image ?? '',
         done_count: this.doneCount,
         failed_count: this.failedCount
      }

      db.set(this.getTable(), tableSafe, "message_id").then(() => {
         console.log("UserQuestion saved");
      });
   }

}

module.exports = UserQuestion;