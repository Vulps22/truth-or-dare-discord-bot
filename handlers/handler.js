
const { SelectMenuBuilder, ModalBuilder, ActionRowBuilder } = require('@discordjs/builders');
const Database = require('../objects/database.js');
const { Interaction, StringSelectMenuOptionBuilder, StringSelectMenuBuilder, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');
const BanHandler = require('./banHandler.js');
const logger = require('../objects/logger.js');
const Question = require('../objects/question.js');

class Handler {
  /**
   * @type {Database}
   */
  db;
  /**
   * @type {string<"dare"|"truth">}
   */
  type;

  vote_count = 3;
  ALPHA = false;

  constructor(type) {
    this.db = new Database();
    this.type = type;
    const ALPHA = process.env['ALPHA'] ?? false;

    if (ALPHA) {
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

  /**
   * 
   * @param {Interaction} interaction 
   * @param {string} id 
   */
  banQuestion(interaction, id) {
    const reason = interaction.values[0];
    console.log("reason", reason);
  }


  /**
   * send an ephemeral select to the user with a select menu
   * @param {Interaction} interaction 
   * @param {number} id 
   */
  async getBanReason(interaction, id) {
    const banHandler = new BanHandler();
    const banReasons = this.type == 'server' ? banHandler.getServerBanReasons() : banHandler.getBanReasons();
    let reasons = [];

    reasons[0] = new StringSelectMenuOptionBuilder()
      .setLabel('Select a reason')
      .setValue('none')
      .setDefault(true);

    banReasons.forEach((reason) => {
      const option = new StringSelectMenuOptionBuilder()
        .setLabel(reason.name)
        .setValue(reason.value + `_${id}`)
      reasons.push(option);
    });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ban_reason')
      .setMinValues(1)
      .setOptions(reasons);
    const row = new ActionRowBuilder().addComponents(menu);
    const reply = await interaction.reply({ content: 'Select a reason to ban this question', components: [row], ephemeral: true, fetchReply: true });

    const collector = reply.createMessageComponentCollector({
      ComponentType: ComponentType.StringSelect,
      filter: (i) => i.user.id === interaction.user.id && i.customId === 'ban_reason',
      time: 60_000
    })


    collector.on('collect', (i) => {
      console.log(i.values);

      const [reason, id] = i.values[0].split('_');
      this.doBan(i, id, reason);

    })

  }

  async doBan(interaction, id, reason) {
    console.log("ban", id, reason);
    let didBan = false;
    switch (this.type) {
      case 'dare':
        didBan = await new BanHandler().banDare(id, reason);
        break;
      case 'truth':
        didBan = await new BanHandler().banTruth(id, reason);
        break;
      case 'server':
        didBan = await new BanHandler().banServer(id, reason, interaction);
        break;
    }


    if (didBan) {
      await interaction.update({ content: (this.type == 'server' ? 'Server' : 'Question') + ' has been banned', components: [], ephemeral: true });
    }
  }

  createApprovedActionRow() {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`new_${this.type}_approve`)
          .setLabel('Approve')
          .setStyle(ButtonStyle.Success)
          .setDisabled(true),
      );
  }
/**
 * 
 * @param {Interaction} interaction 
 * @param {Question} question 
 */
  async approve(interaction, question) {
    await question.load();
    await question.approve();
    const message = interaction.message;
    const actionRow = this.createApprovedActionRow();
    await message.edit({ components: [actionRow] });
    interaction.reply({ content: 'Question has been approved', ephemeral: true });
  }
}



module.exports = Handler