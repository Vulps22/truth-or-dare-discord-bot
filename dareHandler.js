const { EmbedBuilder, Embed } = require('discord.js');

const Handler = require('./handler.js')
const Question = require('./question.js');
client = null
class DareHandler extends Handler {

  constructor(client) {
    super()
    this.client = client
  }

  createDare(interaction) {
    const question = new Question(interaction.options.getString('text'), interaction.user.id);
    if (!question.question) {
      interaction.reply("You need to give me a dare!");
      return;
    }
    this.db.get("dares").then((dares) => {
      if (dares.some(q => q.question === question.question)) {
        interaction.reply("This dare already exists!");
        return;
      } else {
        this.db.get("reviewDares").then((dares) => {
          dares.push(question)
          this.db.set("reviewDares", dares).then(() => {
            const embed = new EmbedBuilder()
              .setTitle('New Dare Created!')
              .setDescription(question.question)
              .setColor('#00ff00')
              .setFooter({ text: ' Created by ' + interaction.user.username + ' | ' + 'ID: #' + dares.length, iconURL: interaction.user.displayAvatarURL() });
            interaction.reply("Thank you for your submission. A member of the moderation team will review your dare shortly")
            interaction.channel.send({ embeds: [embed] });
          });
        });
      }
    });
  }

  dare(interaction) {
    this.db.get("dares").then((dares) => {
      const unBannedQuestions = dares.filter(q => !q.isBanned);
      const random = Math.floor(Math.random() * unBannedQuestions.length);
      const dare = unBannedQuestions[random];

      let creator = this.client.users.cache.get(dare.creator + "one");
      if (creator === undefined) creator = { username: "Somebody" };

      const embed = new EmbedBuilder()
        .setTitle('Dare!')
        .setDescription(dare.question)
        .setColor('#6A5ACD')
        .setFooter({ text: `Requested by ${interaction.user.username} | Created By ${creator.username} | #${random}`, iconURL: interaction.user.displayAvatarURL() });
      interaction.reply("Here's your Dare!")
      interaction.channel.send({ embeds: [embed] });
    });
  }

  giveDare(interaction) {
    const user = interaction.options.getUser('user');
    const dare = interaction.options.getString('dare');

    // Send an error message if no user was mentioned
    if (!user) {
      interaction.reply('Please mention a user to give a dare to!');
      return;
    }

    // Send an error message if no dare was provided
    if (!dare) {
      interaction.reply('Please provide a dare!');
      return;
    }

    // Construct the message to send
    const messageText = `${user}, ${interaction.user} has dared you to ${dare}!`;

    // Create an embed with the message and send it
    const embed = new EmbedBuilder()
      .setTitle("You've been dared!")
      .setDescription(messageText)
      .setColor('#6A5ACD')


    interaction.reply({ embeds: [embed] });
  }

  async listAll(interaction) {
    await this.db.get("dares").then((dares) => {

      for (let i = 0; i < dares.length; i++) {
        if (dare[i].isBanned) {
          continue;
        }
        let creator = this.client.users.cache.get(dare[i].creator);
        if (creator === undefined) creator = { username: "Somebody" };

        const embed = new EmbedBuilder()
          .setTitle('Dare')
          .setDescription(unBannedQuestions[i].question)
          .setColor('#6A5ACD')
          .setFooter({ text: `Created By ${creator.username} | ID: #` + i });

        interaction.channel.send({ embeds: [embed] });
      }
    })
  }

  ban(interaction) {
    let id = interaction.options.getInteger("id")
    this.db.get("dares").then((dares) => {
      if (dares.length > id) {
        let dare = dares[id]
        dare.isBanned = true
        dares[id] = dare
        this.db.set("dares", dares).then(() => {
          interaction.reply("Dare " + id + " has been banned!")
        })
      } else {
        interaction.reply("This Dare does not exist")
      }
    })
  }
}

module.exports = DareHandler;