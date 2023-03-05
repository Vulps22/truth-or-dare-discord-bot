const Question = require('./question.js');

class DashboardHandler {
  constructor() {
    const Database = require("@replit/database");
    this.db = new Database();
  }

  async getTruths(callback) {
    console.log("Get Truths")
    try {
      this.db.get("truths").then(truths => {
        console.log("Gotten Truths");
        const truthArray = truths.map((truth, index) => {
          const question = new Question(truth.question, truth.creator);
          question.id = index;
          return question.toJson();
        });
        console.log("Return!")
        callback(truthArray);
      })
    } catch (error) {
      console.log("Error");
      console.error(error);
      callback(error.message);
    }
  }

  async getDares(callback) {
    console.log("Get Dares")
    try {
      this.db.get("dares").then(dares => {
        console.log("Gotten Dares");
        const dareArray = dares.map((dare, index) => {
          const question = new Question(dare.question, dare.creator);
          question.id = index;
          return question.toJson();
        });
        console.log("Return!")
        callback(dareArray);
      })
    } catch (error) {
      console.log("Error");
      console.error(error);
      callback(error.message);
    }
  }


  async getDareReviewables(callback) {
    console.log("Get Dare Reviewables")
    try {
      this.db.get("dare_review").then(dares => {
        console.log("Gotten Dares");
        console.log(dares)
        if (!dares) dares = [];
        const dareArray = dares.map((dare, index) => {
          const question = new Question(dare.question, dare.creator);
          question.id = index;
          return question.toJson();
        });
        console.log("Return!")
        callback(dareArray);
      })
    } catch (error) {
      console.log("Error");
      console.error(error);
      callback(error.message);
    }
  }

  async getServers(callback) {
    console.log("Get servers")
    try {
      const servers = await this.db.list("guild");
      console.log("Gotten servers");
      const serverArray = await Promise.all(servers.map(async (guildId, index) => {
        const guild = await this.db.get(guildId);
        guild.key = guildId
        console.log(guild)
        return guild
      }));
      console.log("Return!")
      callback(serverArray);
    } catch (error) {
      console.log("Error");
      console.error(error);
      callback(error.message);
    }
  }

  async banDare(id, callback) {

  }

  async deleteTruth(id, callback) {
    console.log(id)
    try {
      if (!id && id !== 0) {
        callback(false);
        return;
      }

      this.db.get("truths").then((truths) => {
        const x = truths.splice(id, 1);
        console.log(x)
        console.log(truths)
        this.db.set("truths", truths).then(() => {
          callback(true)
        })
      })
    } catch (error) {
      console.log(error.message)
      callback(false)
    }
  }

  async deleteDare(id, callback) {
    console.log(id)
    try {
      if (!id && id !== 0) {
        callback(false);
        return;
      }

      this.db.get("dares").then((dares) => {
        const x = dares.splice(id, 1);
        console.log(x)
        console.log(dares)
        this.db.set("dares", dares).then(() => {
          callback(true)
        })
      })
    } catch (error) {
      console.log(error.message)
      callback(false)
    }
  }
}



module.exports = DashboardHandler;