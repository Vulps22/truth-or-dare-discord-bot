const { ModalBuilder, ActionRowBuilder, TextInputBuilder } = require('@discordjs/builders');
const Database = require('objects/database.js');
const { Interaction, StringSelectMenuOptionBuilder, StringSelectMenuBuilder, ComponentType, ButtonBuilder, ButtonStyle, TextInputStyle, EmbedBuilder } = require('discord.js');
const BanHandler = require('handlers/banHandler.js');
const logger = require('objects/logger.js');
const Question = require('objects/question.js');

class Handler {
  /**
   * @type {Database}
   */
  db;
  /**
   * @type {string<"dare"|"truth">}
   */
  type;

  vote_count;
  ALPHA = false;

  constructor(type) {
    this.db = new Database();
    this.type = type;
    this.ALPHA = my.environment === 'dev'
    this.vote_count = my.required_votes

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
    let banReasons;

    switch(this.type) {
      case 'server':
        banReasons = banHandler.getServerBanReasons();
        break;
      case 'user':
        banReasons = banHandler.getUserBanReasons();
        break;
      default:
        banReasons = banHandler.getBanReasons();
    }

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
    const reply = await interaction.followUp({ content: 'Select a reason for this ban', components: [row], fetchReply: true });
    interaction.editReply("Choose a Reason");

    const collector = reply.createMessageComponentCollector({
      ComponentType: ComponentType.StringSelect,
      filter: (i) => i.customId === 'ban_reason',
      time: 60_000
    })


    collector.on('collect', async (i) => {
      console.log(i.values);

      const [reason, id] = i.values[0].split('_');

      if (reason === 'other') {
        await this.useCustomBanModal(i, id);  // Call the new function for custom reason
      } else {
        this.doBan(i, id, reason);
      }

    })

  }

  /**
 * Opens a modal to collect a custom ban reason from the user.
 * @param {Interaction} interaction 
 * @param {number} id 
 */
async useCustomBanModal(interaction, id) {
  const modal = new ModalBuilder()
    .setCustomId('customBanReason')
    .setTitle('Enter Custom Ban Reason')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('custom_reason')
          .setLabel('Ban Reason')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Provide a reason for this ban')
          .setRequired(true)
      )
    );

  await interaction.showModal(modal);

  // Collect modal submission
  const modalFilter = (modalInteraction) => modalInteraction.customId === 'customBanReason';
  interaction.awaitModalSubmit({ filter: modalFilter, time: 60_000 })
    .then((modalInteraction) => {
      const customReason = modalInteraction.fields.getTextInputValue('custom_reason');
      this.doBan(modalInteraction, id, customReason);
    })
    .catch((err) => {
      console.error("Modal timed out or encountered an error:", err);
      interaction.followUp({ content: "Timed out or encountered an error while waiting for a response.", ephemeral: true });
    });
}


  /**
   * 
   * @param {Interaction} interaction 
   * @param {number} id 
   * @param {string} reason 
   */
  async doBan(interaction, id, reason) {
    await interaction.deferReply({ephemeral: true});
    console.log("ban", id, reason);
    let didBan = false;

    switch (this.type) {
      case 'dare':
        didBan = await new BanHandler().banQuestion(id, reason, interaction);
        break;
      case 'truth':
        didBan = await new BanHandler().banQuestion(id, reason, interaction);
        break;
      case 'server':
        didBan = await new BanHandler().banServer(id, reason, interaction);
        break;
      case 'user':
        didBan = await new BanHandler().banUser(id, reason, interaction);
    }

    if (!didBan) {
       // You can also respond with an ephemeral message indicating failure if needed
      await interaction.followUp({ content: 'Ban Failed', ephemeral: true });
    }
}

  /**
   * 
   * @param {Interaction} interaction 
   * @param {Question} question 
   */
  async approve(interaction, question) {
    if(!interaction.deferred) await interaction.deferReply({ephemeral: true});
    await question.load();
    await question.approve(interaction.user.id);
    
    await question.save();

    if (question.type === 'dare') {
      await logger.updateDare(question);
    } else {
      await logger.updateTruth(question); 
    }

    interaction.editReply({ content: 'Question has been approved', ephemeral: true });
  }

  getEmbed(question) {
    return new EmbedBuilder()
        .setTitle(`New ${this.type === 'truth' ? 'Truth' : 'Dare'}`)
        .addFields(
            { name: "Content", value: question.question ?? '' },
            { name: "Author", value: question.creator ?? '' },
            { name: "Server:", value: question.server.name },
            { name: "Approved By:", value: question.banReason ?? '' }
        )
        .setFooter(`#${question.id}`);
  }
}



module.exports = Handler