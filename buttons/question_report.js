module.exports = {
  name: 'question_report',
  /**
   * 
   * @param {import('structures/botbuttonInteraction').BotButtonInteraction} interaction 
   */
  async execute(interaction) {
    await interaction.ephemeralReply("We're working on this nifty button :) In the meantime, please use /report to report any inappropriate content");
  }
};
