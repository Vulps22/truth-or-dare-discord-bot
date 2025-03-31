const { 
  Interaction,
  StringSelectMenuOptionBuilder, 
  StringSelectMenuBuilder, 
  ComponentType, 
  ButtonBuilder, 
  ButtonStyle, 
  TextInputStyle, 
  EmbedBuilder, 
  Snowflake 
} = require('discord.js');
const { ModalBuilder, ActionRowBuilder, TextInputBuilder } = require('@discordjs/builders');
const Database = require('objects/database.js');
const BanHandler = require('handlers/banHandler.js');
const logger = require('objects/logger.js');
const Question = require('objects/question.js');
const UserQuestion = require('objects/userQuestion');

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

  /**
   * Creates an embed to show the question to the user.
   * @param {Question} question 
   * @param {Interaction} interaction 
   * @param {string} username The username of the user who created the question, or "unknown" if not available.
   * @returns {EmbedBuilder} The embed object to be sent in the message.
   */
  createQuestionEmbed(question, interaction, username) {

    const type = question.type === 'truth' ? 'Truth' : 'Dare';

		let questionText = `${question.question}\n\n **Votes:** 0 Done | 0 Failed`;

		return new EmbedBuilder()
			.setTitle(`${type}!`)
			.setDescription(questionText)
			.setColor('#6A5ACD')
			.setFooter({ text: `Requested by ${interaction.user.username} | Created By ${username} | #${question.id}`, iconURL: interaction.user.displayAvatarURL() });
	}

  /**
   * Selects a random question from the provided array.
   * @param {Question[]} questions 
   * @returns {Question} A random question from the provided array.
   */
  selectRandom(questions) {
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }

  /**
     * Asynchronously gets the creator of a dare from an interaction within a guild.
     * 
     * @param {Question} question - The question object with a 'creator' property holding the user ID.
     * @param {Interaction} interaction - The interaction from which the guild and users are accessed.
     * @returns {User} The user object of the creator or a default user object if not found.
     */
    async getCreator(question, interaction) {
      // Check if the interaction has a guild and the guild is properly fetched
      if (!interaction.guild) {
        console.error("Guild is undefined. Ensure this function is used within a guild context.");
        return { username: "Somebody" };
      }
  
      try {
        // Fetch the user from the guild
        const creator = await interaction.guild.members.fetch(dare.creator);
        return creator.user;
      } catch (error) {
        // Handle cases where the user cannot be fetched (e.g., not in guild, API error)
        if (error.code !== 10007) {
          // Log other errors
          logger.error('Unexpectedly failed to fetch username in dareHandler: ', error)
        }
  
        return { username: "Somebody" };
      }
    }

    /**
     * Create a new UserQuestion instance and save it to the database.
     * This is used to track the message ID of the question for voting purposes.
     * @param {Snowflake} messageId 
     * @param {Snowflake} userId 
     * @param {number} questionId 
     * @param {Snowflake} serverId 
     * @param {string} username 
     * @param {*} image 
     */
    async saveQuestionMessageId(messageId, userId, questionId, serverId, username, image) {

      if (!messageId) {
        await interaction.channel.send("I'm sorry, I couldn't save the question to track votes. This is a brain fart. Please reach out for support on the official server.");
        logger.error(`Brain Fart: Couldn't save question to track votes. Message ID missing`);
      } else {
        const userQuestion = new UserQuestion(messageId, userId, questionId, serverId, username, image, 0, 0, this.type);
        await userQuestion.save();

      }
    }

  /**
	 * 
   * @param { "truth" | "dare" } type
	 * @param {Interaction} interaction 
	 * @returns 
	 */

	async getQuestion(type, interaction) {

		if (!interaction.deferred) await interaction.deferReply();
		try {
			const questions = await Question.collect(type);
			if (!questions || questions.length === 0) {
				return interaction.editReply(`Hmm, I can't find any ${type}s. This might be a bug, try again later`);
			}

			const unBannedQuestions = questions.filter(q => !q.isBanned && q.isApproved);
			if (unBannedQuestions.length === 0) { interaction.editReply(`There are no approved ${type}s to give`); return; }
			const question = this.selectRandom(unBannedQuestions);

			const creator = await this.getCreator(question, interaction);
			const username = creator.username ?? "Somebody";

			const embed = this.createQuestionEmbed(question, interaction, username);
			const row = this.createActionRow();

			const message = await interaction.editReply({ content: `Here's your ${type == "truth" ? "Truth" : "Dare"}!`, embeds: [embed], components: [row], fetchReply: true });
			await this.saveQuestionMessageId(message.id, interaction.user.id, question.id, interaction.guildId, interaction.user.username, interaction.user.displayAvatarURL());
		} catch (error) {
			console.error('Error in handler.getQuestion function:', error);
			interaction.editReply("Woops! Brain Fart! Try another Command while I work out what went Wrong :thinking:");
			logger.error(`Brain Fart: Error in getQuestion function: ${error}`);
		}
	}
}



module.exports = Handler