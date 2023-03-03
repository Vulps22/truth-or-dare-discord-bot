const { EmbedBuilder } = require("discord.js");

class EmbededMessage {

  embed = new EmbedBuilder()

  constructor(type, question, sender, creator, id) {

    this.question = question;

    if (type === "truth") {
      this.title = "Truth";
      this.color = "#FFC0CB"
    }

    this.embed.setTitle(this.title)
      .setDescription(this.question)
      .setColor(this.color)
      .setFooter({ text: `Requested by ${sender} | Created By ${creator} | #${id}`, iconURL: interaction.user.displayAvatarURL() });
  }

  output() {
    return this.embed;
  }
}