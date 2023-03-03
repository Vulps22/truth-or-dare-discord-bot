const { EmbedBuilder, Embed, Client } = require('discord.js');

const Handler = require('./handler.js')
const Question = require('./question.js');
client = null;

class TruthHandler extends Handler {

  constructor(client) {
    super()
    this.client = client
  }


  createTruth(interaction) {
    const question = new Question(interaction.options.getString('text'), interaction.user.id);
    if (!question.question) {
      interaction.reply("You need to give me a truth!");
      return;
    }
    this.db.get("truths").then((truths) => {
      if (truths.some(q => q.question === question.question)) {
        interaction.reply("This truth already exists!");
        return;
      } else {
        truths.push(question);
        this.db.set("truths", truths).then(() => {
          const embed = new EmbedBuilder()
            .setTitle('New Truth Created!')
            .setDescription(question.question)
            .setColor('#00ff00')
            .setFooter({ text: `Created by ${interaction.user.username} | ID: #${truths.length}`, iconURL: interaction.user.displayAvatarURL() });
          interaction.reply("Thank you for your submission")
          interaction.channel.send({ embeds: [embed] });
        });
      }
    });
  }

  truth(interaction) {
    console.log(client)
    this.db.get("truths").then((truths) => {
      const unBannedQuestions = truths.filter(q => !q.isBanned);
      const random = Math.floor(Math.random() * unBannedQuestions.length);
      const truth = unBannedQuestions[random];

      let creator = this.client.users.cache.get(truth.creator);
      if (creator === undefined) creator = { username: "Somebody" };

      const embed = new EmbedBuilder()
        .setTitle('Truth')
        .setDescription(truth.question)
        .setColor('#FFC0CB')
        .setFooter({ text: `Requested by ${interaction.user.username} | Created By ${creator.username} | #${random}`, iconURL: interaction.user.displayAvatarURL() });
      interaction.reply("Here's your Truth!")
      interaction.channel.send({ embeds: [embed] });
    });
  }

  listAll(interaction) {
    this.db.get("truths").then((truths) => {

      const questions = []
      
      for (let i = 0; i < truths.length; i++) {

        if (truths[i].isBanned) continue;

        let creator = this.client.users.cache.get(truths[i].creator);
        if (creator === undefined) creator = { username: "Somebody" };

        questions.push("ID: ${i} \n ${truths[i].question} \n Created By: ${creator.username}")
        
        if(questions.length % 50 === 0){
          const embed = new EmbedBuilder()
            .setTitle('Truth')
            .setDescription(truths[i].question)
            .setColor('#FFC0CB');
          interaction.channel.send({ embeds: [embed] });
        }
      }
    })
  }

  ban(interaction) {
    let id = interaction.options.getInteger("id")
    this.db.get("truths").then((truths) => {
      if (truths.length > id) {
        let truth = truths[id]
        truth.isBanned = true
        truths[id] = truth
        this.db.set("truths", truths).then(() => {
          interaction.reply("Truth " + id + " has been banned!")
        })
      } else {
        interaction.reply("This Truth does not exist")
      }
    })
  }
}

module.exports = TruthHandler;