const {
	/* eslint-disable no-unused-vars */
	Interaction,
	StringSelectMenuOptionBuilder,
	StringSelectMenuBuilder,
	ComponentType,
	ButtonBuilder,
	ButtonStyle,
	TextInputStyle,
	EmbedBuilder,
	Snowflake,
	MessageFlags,
	Message
} = require('discord.js');
const { ModalBuilder, ActionRowBuilder, TextInputBuilder } = require('@discordjs/builders');
const Database = require('objects/database.js');
const BanHandler = require('handlers/banHandler.js');
const logger = require('objects/logger.js');
const Question = require('objects/question.js');
const UserQuestion = require('objects/userQuestion');
const GivenQuestion = require('objects/givenQuestion');
const Server = require('objects/server');
const Purchasable = require('objects/purchasable');
const User = require('objects/user');

class Handler {
	/**
	 * @type {Database}
	 */
	db;
	/**
	 * @type {string<"dare"|"truth">}
	 */
	type;

	xpValues = {
		dare: {
			success: 50,
			fail: 25,
		},
		truth: {
			success: 30,
			fail: 15,
		}
	};

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
	   * @returns 
	   */
	async createQuestion(interaction) {
		const question = new Question(null, this.type);

		question.question = interaction.options.getString('text');
		if (!question.question) {
			interaction.editReply(`You need to give me a ${this.type}!`);
			logger.error('Aborted Question creation: Nothing Given');
			return;
		}

		let questions = await this.db.list("questions", `type = '${this.type}'`);
		if (questions.some(q => q.question === question.question)) {
			interaction.editReply(`This ${this.type} already exists!`);
			logger.log(`Aborted Question creation: Already exists`);
			return;
		} else {
			let createdQuestion = await question.create(interaction.options.getString('text'), interaction.user.id, interaction.guildId);

			const embed = new EmbedBuilder()
				.setTitle(`New ${this.type == "truth" ? "Truth" : "Dare"} Created!`)
				.setDescription(question.question)
				.setColor('#00ff00')
				.setFooter({ text: ' Created by ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

			const now = new Date();
			//Moderators will be on holiday between 22/12 and 02/01
			if ((now.getMonth() == 11 && now.getDate() >= 3) || (now.getMonth() == 0 && now.getDate() == 1)) {
				//send a christmas message
				interaction.editReply({ content: "Thank you for your submission. Our excellent and dedicated team of moderators have decided to take christmas off from moderation.\n Your submission will be reviewed when they return on the 2nd of January\n\n Merry Christmas 🎄" });

			} else {
				//Not Christmas
				interaction.editReply({ content: `Thank you for your submission. A member of the moderation team will review your ${this.type} shortly` });
			}

			interaction.channel.send({ embeds: [embed] });

			logger.newQuestion(createdQuestion);
		}
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
	 * @param {number} id - the id of the question, server, or user
	 */
	async getBanReason(interaction, id) {
		const banHandler = new BanHandler();
		let banReasons;

		switch (this.type) {
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
		const reply = await interaction.message.edit({ content: 'Select a reason for this ban', components: [row], fetchReply: true });
		interaction.editReply("Please Check the original message for the ban reason select menu");

		const collector = reply.createMessageComponentCollector({
			ComponentType: ComponentType.StringSelect,
			filter: (i) => i.customId === 'ban_reason',
			time: 60_000
		})


		collector.on('collect', async (i) => {
			i.handled = true;
			console.log(i.values);

			const [reason, id] = i.values[0].split('_');

			if (reason === 'other') {
				await this.useCustomBanModal(i, id);  // Call the new function for custom reason
			} else {
				this.doBan(i, id, reason);
			}

		})

		collector.on('end', async (collected, reason) => {
			if (reason === 'time') {
				await this.updateBannable(interaction.message.id);
			}

		});


	}

	async updateBannable(messageId) {
		const question = await new Question().find(messageId);
		if (question) {
			await logger.updateQuestion(question);
			return true;
		} else { //the question does not exist, so check if it's a server
			const server = await new Server().find(messageId);
			if (!server) return false;
			await logger.updateServer(server);
			return true;
		}
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
		await interaction.deferReply({ ephemeral: true });
		console.log("ban", id, reason);
		let didBan = false;

		switch (this.type) {
			case 'dare':
			case 'truth':
			case 'question':
				didBan = await new BanHandler().banQuestion(id, reason, interaction);
				break;
			case 'server':
				didBan = await new BanHandler().banServer(id, reason, interaction);
				break;
			case 'user':
				didBan = await new BanHandler().banUser(id, reason, interaction);
				break;
			default:
				console.error("Invalid type provided for ban operation:", this.type);
				interaction.followUp({ content: 'Invalid type provided', ephemeral: true });
				return;
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
		if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });
		await question.load();
		await question.approve(interaction.user.id);

		await question.save();

		logger.updateQuestion(question, false);

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

		let questionText = `${question.question}\n\n`;
		const expiryTime = new Date().getTime() + (48 * 60 * 60 * 1000);

		return new EmbedBuilder()
			.setTitle(`${type}!`)
			.setDescription(questionText)
			.addFields(
				{ name: "Auto Fails", value: `<t:${Math.floor(expiryTime / 1000)}:R>`, inline: true },
				{ name: "Votes", value: `Done: 0 | Failed: 0`, inline: false }

			)
			.setColor('#6A5ACD')
			.setFooter({
				text: `Requested by ${interaction.user.username} | Created By ${username} | #${question.id}`,
				iconURL: interaction.user.displayAvatarURL()
			});
	}

	/**
 * Creates an embed for the question, updated with the latest vote counts.
 * @param {UserQuestion} userQuestion 
 * @param {Interaction} interaction 
 * @returns {Promise<EmbedBuilder>}
 */
	async createUpdatedQuestionEmbed(userQuestion, interaction) {
		const question = await userQuestion.getQuestion();
		const questionText = question.question;
		const creator = await this.getCreator(question, interaction);
		const username = creator.username;
		const type = userQuestion.getType();

		// Calculate expiry timestamp
		const createdAt = new Date(userQuestion.datetime_created).getTime();
		const expiryTime = createdAt + (48 * 60 * 60 * 1000);

		return new EmbedBuilder()
			.setTitle(`${type}!`)
			.setDescription(questionText)
			.addFields(
				{ name: "Auto Fails", value: `<t:${Math.floor(expiryTime / 1000)}:R>`, inline: true },
				{ name: "Votes", value: `Done: ${userQuestion.doneCount} | Failed: ${userQuestion.failedCount}`, inline: false }
			)
			.setColor('#6A5ACD')
			.setFooter({
				text: `Requested by ${userQuestion.username} | Created By ${username} | #${question.id}`,
				iconURL: userQuestion.image
			});
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
			const creator = await interaction.guild.members.fetch(question.creator);
			return creator.user;
		} catch (error) {
			// Handle cases where the user cannot be fetched (e.g., not in guild, API error)
			if (error.code !== 10007) {
				// Log other errors
				logger.error('Unexpectedly failed to fetch username in questionHandler: ', error)
			}

			return { username: "Somebody" };
		}
	}

	/**
	 * Create a new UserQuestion instance and save it to the database.
	 * This is used to track the message ID of the question for voting purposes.
	 * @param {Snowflake} messageId 
	 * @param {Snowflake} channelId
	 * @param {Snowflake} userId 
	 * @param {number} questionId 
	 * @param {Snowflake} serverId 
	 * @param {string} username 
	 * @param {*} image 
	 * @returns {Promise<bool>}
	 */
	async saveQuestionMessageId(messageId, channelId, userId, questionId, serverId, username, image) {

		if (!messageId) {
			logger.error(`Brain Fart: Couldn't save question to track votes. Message ID missing`);
			return false;
		} else {
			const userQuestion = new UserQuestion(messageId, userId, channelId, questionId, serverId, username, image, 0, 0, this.type);
			await userQuestion.save();
			return true;

		}
	}

	/**
	   * gets a random question from the database and sends it to the user
	 * uses the type to determine if it's a truth or dare
	   * @param {Interaction} interaction 
	   * @returns 
	   */

	async getQuestion(interaction) {

		if (!interaction.deferred) await interaction.deferReply();
		try {
			const questions = await Question.collect(this.type);
			if (!questions || questions.length === 0) {
				return interaction.editReply(`Hmm, I can't find any ${this.type}s. This might be a bug, try again later`);
			}

			const unBannedQuestions = questions.filter(q => !q.isBanned && q.isApproved);
			if (unBannedQuestions.length === 0) { interaction.editReply(`There are no approved ${this.type}s to give`); return; }
			const question = this.selectRandom(unBannedQuestions);

			const creator = await this.getCreator(question, interaction);
			const username = creator.username ?? "Somebody";

			const embed = this.createQuestionEmbed(question, interaction, username);
			const row = this.createActionRow();

			/** @var {Message} */
			const message = await interaction.editReply({ content: `Here's your ${this.type == "truth" ? "Truth" : "Dare"}!`, embeds: [embed], components: [row], fetchReply: true });
			const didSave = await this.saveQuestionMessageId(message.id, message.channelId, interaction.user.id, question.id, interaction.guildId, interaction.user.username, interaction.user.displayAvatarURL());
			if (!didSave) {
				await interaction.channel.send("I'm sorry, I couldn't save the question to track votes. This is a brain fart. Please reach out for support on the official server.");
			}
		} catch (error) {
			console.error('Error in handler.getQuestion function:', error);
			interaction.editReply("Woops! Brain Fart! Try another Command while I work out what went Wrong :thinking:");
			logger.error(`Brain Fart: Error in getQuestion function: ${error}`);
		}
	}

	/**
	   * 
	   * @param {Interaction} interaction 
	   * @returns 
	   */
	async giveQuestion(interaction) {
		if (!interaction.deferred) await interaction.deferReply({ ephemeral: true })
		const type = this.type === 'truth' ? 'Truth' : 'Dare';
		const target = interaction.options.getUser('user');
		const question = interaction.options.getString('truth');
		const wager = interaction.options.getInteger('wager');
		const xpType = interaction.options.getString('type');

		// Send an error message if no user was mentioned
		if (!target) {
			interaction.editReply(`Please mention a user to give a ${type} to!`);
			return;
		}

		// Send an error message if no dare was provided
		if (!question) {
			interaction.editReply('Please provide a question!');
			return;
		}

		if (wager < 1) {
			interaction.editReply('You must offer a wager');
			return;
		}
		const given = GivenQuestion.create(interaction, question, interaction.user.id, target.id, interaction.guildId, wager, xpType, this.type);
		interaction.editReply({ content: `Your ${type} has been sent`, ephemeral: true });
	}


	/**
	   * 
	   * @param {Interaction} interaction 
	   * @returns 
	   */
	async vote(interaction) {
		if (!interaction.deferred) await interaction.deferReply({ content: "Registering your vote", ephemeral: true })

		const userQuestion = await new UserQuestion().load(interaction.message.id);

		if (!userQuestion) {
			await interaction.editReply("I'm sorry, I couldn't find the dare to track votes. This is a brain fart. Please reach out for support on the official server.");
			logger.error(`Brain Fart: Couldn't find dare to track votes. Message ID missing`);
			return;
		}

		//load the user		
		/** @type {User} */
		const user = await userQuestion.getUser();
		const serverUserLoaded = await user.loadServerUser(interaction.guildId);

		if (!serverUserLoaded) {
			await interaction.editReply("Failed to load server user data. Please try again.");
			logger.error(`Failed to load server user data for user ${user.id} in server ${interaction.guildId}`);
			return;
		}

		//load the server
		const server = new Server(interaction.guildId);
		await server.load();

		const dareUser = userQuestion.getUserId();

		if (interaction.customId === 'question_skip') {
			this.doSkip(interaction, userQuestion, dareUser, user);
		} else {
			this.doVote(interaction, userQuestion, dareUser, user, server)
		}

	}
	/**
	 * 
	 * @param {Interaction} interaction 
	 * @param {UserQuestion} userQuestion 
	 * @param {string} questionUser 
	 * @param {User} user 
	 * @returns 
	 */
	async doSkip(interaction, userQuestion, questionUser, user) {

		if (questionUser != interaction.user.id) {
			interaction.editReply({ content: `You can't skip someone else's ${this.type}!`, ephemeral: true });
			return;
		}

		if (!user.hasValidVote()) {

			/**
			* @type {Purchasable}
			*/
			const purchasable = await new Purchasable(Purchasable.SKIP10).load();

			const row = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setLabel('Vote on Top.gg')
					.setStyle(ButtonStyle.Link)
					.setURL('https://top.gg/bot/1079207025315164331/vote'),
				// TODO: Fix and reimplement the purchasable button - See #50
				//new ButtonBuilder()
				//	.setStyle(ButtonStyle.Premium)
				//	.setSKUId(purchasable.skuId)
			);
			interaction.editReply(
				{
					content: "Uh oh! You're out of Skips!\nNot to worry, You can earn up to 10 skips by voting for the bot every day on [top.gg](https://top.gg/bot/1079207025315164331/vote)!",
					components: [row],
					flags: MessageFlags.Ephemeral
				});
			return;
		}

		const embed = await this.createUpdatedQuestionEmbed(userQuestion, interaction);
		const row = await this.createSkippedActionRow();

		//use the userQuestion.messageId to edit the embed in the message
		await interaction.message.edit({ embeds: [embed], components: [row] });
		await user.burnVote();
		console.log(this.type)
		await interaction.editReply({ content: `Your ${this.type} has been skipped! You have ${user.voteCount} skips remaining!`, ephemeral: true });

	}

	/**
	 * 
	 * @param {Interaction} interaction 
	 * @param {UserQuestion} userQuestion 
	 * @param {String} questionUser 
	 * @param {User} user 
	 * @param {Server} server 
	 * @returns 
	 */
	async doVote(interaction, userQuestion, questionUser, user, server) {

		if (questionUser == interaction.user.id && !this.ALPHA) {
			interaction.editReply({ content: "You can't vote on your own dare!", ephemeral: true });
			return;
		}

		const vote = interaction.customId === 'question_done' ? 'done' : 'failed';

		const couldVote = await userQuestion.vote(interaction.user.id, vote);
		if (!couldVote && !this.ALPHA) {
			await interaction.editReply({ content: "You've already voted on this dare!", ephemeral: true });
			return;
		}

		const embed = await this.createUpdatedQuestionEmbed(userQuestion, interaction);

		let row = this.createActionRow();

		if (userQuestion.doneCount >= this.vote_count) {
			row = this.createPassedActionRow();
			user.addXP(this.xpValues[userQuestion.type].success, interaction);
			user.addServerXP(server[`${userQuestion.type}_success_xp`], interaction);

		} else if (userQuestion.failedCount >= this.vote_count) {
			row = this.createFailedActionRow();
			user.subtractXP(this.xpValues[userQuestion.type].fail);
			user.addServerXP(server[`${userQuestion.type}_fail_xp`]);

		}

		//use the userDare.messageId to edit the embed in the message
		await interaction.message.edit({ embeds: [embed], components: [row] });
		await interaction.editReply({ content: "Your vote has been recorded!", ephemeral: true });
	}

	createActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('question_done')
					.setLabel('DONE')
					.setStyle(ButtonStyle.Success), // Green button
				new ButtonBuilder()
					.setCustomId('question_failed')
					.setLabel('FAILED')
					.setStyle(ButtonStyle.Danger), // Red button
				new ButtonBuilder()
					.setCustomId('question_skip')
					.setLabel('SKIP')
					.setStyle(ButtonStyle.Secondary), // Red button
			);
	}

	createPassedActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('question_done')
					.setLabel('PASSED')
					.setDisabled(true)
					.setStyle(ButtonStyle.Success), // Green button
			);
	}

	createFailedActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('question_failed')
					.setLabel('FAILED')
					.setDisabled(true)
					.setStyle(ButtonStyle.Danger), // Red button
			);
	}

	createAbandonedActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('question_abandoned')
					.setLabel('ABANDONED')
					.setDisabled(true)
					.setStyle(ButtonStyle.Danger), // gray button
			);
	}

	createSkippedActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('question_skipped')
					.setLabel('SKIPPED')
					.setDisabled(true)
					.setStyle(ButtonStyle.Secondary), // Red button
			);
	}

	/**
	   * mark the question as approved or banned
	   * @param {Interaction} interaction 
	   * @param {string<"ban"|"approve"} decision
	   */
	async setQuestion(interaction, decision) {
		if (!interaction.deferred) await interaction.deferReply({ ephemeral: true })
		let question = await new Question().find(interaction.message.id);

		if (!question) {
			interaction.editReply("This question could not be found.");
			return;
		}

		switch (decision) {
			case "ban":
				this.getBanReason(interaction, question.id);
				break;
			case 'unban':
				await question.unBan();
				logger.updateQuestion(question);
				interaction.editReply("Question has been Unbanned");
				break;
			case "approve":
				this.approve(interaction, question);
				break;
		}

	}

	/**
 * Finds and fails all questions that are older than 48 hours
 */
	async expireQuestions() {
		logger.log("[Expire] Starting expiration check...");
		const db = new Database();
		const questions = await db.query(`
		SELECT messageId FROM user_questions
		WHERE finalResult IS NULL
		AND channelId != 'PRE_5_6_9'
		AND skipped = 0
		AND datetime_created < NOW() - INTERVAL 48 HOUR;
	`);

		logger.log(`[Expire] Found ${questions.length} candidate question(s)`);

		if (questions.length === 0) {
			logger.log("[Expire] No questions to expire. Exiting.");
			return;
		}

		for (const question of questions) {
			const userQuestion = await new UserQuestion().load(question.messageId);

			if (!userQuestion) {
				logger.error(`[Expire] Could not load UserQuestion for messageId: ${question.messageId}`);
				continue;
			}

			// Decide final result
			if (userQuestion.doneCount > userQuestion.failedCount) {
				userQuestion.finalResult = "passed";
			} else if (userQuestion.failedCount > 0) {
				userQuestion.finalResult = "failed";
			} else {
				userQuestion.finalResult = "abandoned";
			}

			userQuestion.finalised_datetime = new Date();
			await userQuestion.save();
			logger.log(`[Expire] Saved updated result "${userQuestion.finalResult}" to DB for ${question.messageId}`);

			// Get appropriate action row and content
			let row;
			let content;
			switch (userQuestion.finalResult) {
				case "passed":
					row = this.createPassedActionRow();
					content = null;
					break;
				case "failed":
					row = this.createFailedActionRow();
					content = "Did not receive enough votes to pass in 48 hours.";
					break;
				case "abandoned":
					row = this.createAbandonedActionRow();
					content = "Automatically abandoned because no votes were cast in 48 hours.";
					break;
				default:
					console.error(`[Expire] Unknown finalResult: ${userQuestion.finalResult} for messageId: ${question.messageId}`);
					continue;
			}

			const channelId = userQuestion.channelId;
			const messageId = userQuestion.id;
			console.log(`[Expire] Attempting to update message ${messageId} in channel ${channelId}`);

			//const embed = await this.createUpdatedQuestionEmbed(userQuestion);
			console.log(`[Expire] Created embed for message ${messageId}`);
			const message = { content, components: [row] };
			console.log(`[Expire] Created message object for message ${messageId}`);
			let success = false;
			try {
				success = await logger.editMessageInChannel(channelId, messageId, message);
			} catch (error) {
				logger.error(`[Expire] Error while editing message ${messageId} in channel ${channelId}:`, error);
				continue;
			}

			if (success) {
				logger.log(`[Expire] ✅ Message ${messageId} updated with "${userQuestion.finalResult}"`);
			} else {
				logger.error(`[Expire] ⚠️ Failed to update message ${messageId} in channel ${channelId}`);
			}
		}

		logger.log("[Expire] Finished processing expired questions.");
	}


}



module.exports = Handler