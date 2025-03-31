const { 
	/* eslint-disable no-unused-vars */
	Interaction, 
	EmbedBuilder, 
	ActionRowBuilder, 
	ButtonBuilder, 
	ButtonStyle, 
	Client, 
	MessageFlags
} = require('discord.js');

const Handler = require('handlers/handler.js')
const UserTruth = require('objects/userTruth.js');
const User = require('objects/user.js');
const Server = require('objects/server.js');
const Truth = require('objects/truth.js');
const logger = require('objects/logger.js');
const Question = require('objects/question.js');
const GivenQuestion = require('objects/givenQuestion.js');
const Purchasable = require('objects/purchasable');
let client = null;

class TruthHandler extends Handler {

	successXp = 40;
	failXp = 40;

	constructor(client) {
		super("truth")
		this.client = client
	}
	/**
	 * 
	 * @param {Interaction} interaction 
	 * @returns 
	 * @deprecated use createQuestion instead
	 */
	async createTruth(interaction) {
		const truth = new Truth();

		truth.question = interaction.options.getString('text');
		if (!truth.question) {
			interaction.editReply("You need to give me a truth!");
			logger.error(`Aborted Truth creation: Nothing Given`);
			return;
		}
		let truths = await this.db.list("truths");
		if (truths.some(q => q.question === truth.question)) {
			interaction.editReply("This Truth already exists!");
			logger.error(`Aborted Truth creation: Already exists`);
			return;
		} else {
			let createdTruth = await truth.create(interaction.options.getString('text'), interaction.user.id, interaction.guildId);

			const embed = new EmbedBuilder()
				.setTitle('New Truth Created!')
				.setDescription(truth.question)
				.setColor('#00ff00')
				.setFooter({ text: ' Created by ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

			const now = new Date();
			//Moderators will be on holiday between 22/12 and 02/01
			if ((now.getMonth() == 11 && now.getDate() >= 3) || (now.getMonth() == 0 && now.getDate() == 1)) {
				//send a christmas message
				interaction.editReply({ content: "Thank you for your submission. Our excellent and dedicated team of moderators have decided to take christmas off from moderation.\n Your submission will be reviewed when they return on the 2nd of January\n\n Merry Christmas 🎄" });

			} else {
				//Not Christmas
				interaction.editReply({ content: "Thank you for your submission. A member of the moderation team will review your truth shortly" });
			}

			interaction.channel.send({ embeds: [embed] });

			logger.newTruth(createdTruth);
		}
	}

	/**
	 * 
	 * @param {Interaction} interaction 
	 * @returns 
	 * @deprecated use getQuestion instead
	 */
	async truth(interaction) {
		console.log(interaction.deferred);
		if (!interaction.deferred) await interaction.deferReply();
		try {
			const truths = await Question.collect("truth");
			if (!truths || truths.length === 0) { interaction.editReply("Hmm, I can't find any truths. This might be a bug, try again later"); return; }
			const unBannedQuestions = truths.filter(q => !q.isBanned && q.isApproved);
			if (unBannedQuestions.length === 0) { interaction.editReply("There are no approved truths to give."); return; }
			const truth = this.selectRandomTruth(unBannedQuestions);
			//truth = this.db.get()
			const creator = this.getCreator(truth, this.client);

			const embed = this.createTruthEmbed(truth, interaction, creator);
			const row = this.createActionRow();

			const message = await interaction.editReply({ content: "Here's your Truth!", embeds: [embed], components: [row], fetchReply: true });
			await this.saveTruthMessageId(message.id, interaction.user.id, truth.id, interaction.guildId, interaction.user.username, interaction.user.displayAvatarURL());
		} catch (error) {
			console.error('Error in truth function:', error);
			interaction.editReply("Woops! Brain Fart! Try another Command while I work out what went Wrong :thinking:");
			logger.error(`Brain Fart: Error in truth function: ${error}`);
		}
	}

	/**
	 * 
	 * @param {Interaction} interaction 
	 * @returns 
	 * @deprecated use giveQuestion instead
	 */
	async giveTruth(interaction) {
		if (!interaction.deferred) await interaction.deferReply({ ephemeral: true })
		const target = interaction.options.getUser('user');
		const question = interaction.options.getString('truth');
		const wager = interaction.options.getInteger('wager');
		const xpType = interaction.options.getString('type');

		// Send an error message if no user was mentioned
		if (!target) {
			interaction.editReply('Please mention a user to give a truth to!');
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
		const given = GivenQuestion.create(interaction, question, interaction.user.id, target.id, interaction.guildId, wager, xpType, "truth");
		interaction.editReply({ content: "Your truth has been sent", ephemeral: true });
	}

	/**
	 * 
	 * @param {Interaction} interaction 
	 */
	async listAll(interaction) {
		/* eslint-disable no-undef */
		await this.db.list("truths").then((truths) => {

			for (let i = 0; i < truths.length; i++) {
				if (truth[i].isBanned) {
					continue;
				}
				let creator = this.client.users.cache.get(truth[i].creator);
				if (creator === undefined) creator = { username: "Somebody" };

				const embed = new EmbedBuilder()
					.setTitle('Truth')
					.setDescription(unBannedQuestions[i].question)
					.setColor('#6A5ACD')
					.setFooter({ text: `Created By ${creator.username} | ID: #` + i });

				interaction.channel.send({ embeds: [embed] });
			}
		})
	}

	/**
	 * 
	 * @param {Interaction} interaction 
	 * @returns 
	 */
	async ban(interaction) {
		if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });
		let id = interaction.options.getInteger("id");
		let truth = this.db.get("truths", id);
		if (!truth) { interaction.editReply("Truth not found"); return; }

		truth.isBanned = 1;
		this.db.set('truths', Truth);
		interaction.editReply("Truth " + id + " has been banned!");
	}

	/**
	 * 
	 * @param {Truth[]} truths 
	 * @returns 
	 * @deprecated use selectRandom instead
	 */
	selectRandomTruth(truths) {
		const random = Math.floor(Math.random() * truths.length);
		return truths[random];
	}

	/**
	 * 
	 * @param {Truth} truth 
	 * @param {Interaction} interaction 
	 * @param {User} creator 
	 * @returns {EmbedBuilder}
	 * @deprecated use createQuestionEmbed instead
	 */
	createTruthEmbed(truth, interaction, creator) {
		let truthText = `${truth.question}\n\n **Votes:** 0 Done | 0 Failed`;

		return new EmbedBuilder()
			.setTitle('truth!')
			.setDescription(truthText)
			.setColor('#6A5ACD')
			.setFooter({ text: `Requested by ${interaction.user.username} | Created By ${creator.username} | #${truth.id}`, iconURL: interaction.user.displayAvatarURL() });
	}

	/**
	 * 
	 * @param {UserTruth} userTruth 
	 * @param {Interaction} interaction 
	 * @returns Promise<EmbedBuilder>
	 * @deprecated use createUpdatedQuestionEmbed instead
	 */
	async createUpdatedTruthEmbed(userTruth, interaction) {
		let truth = await userTruth.getQuestion();
		let question = truth.question;
		let creator = this.getCreator(truth, this.client);

		let truthText = `${question}\n\n **Votes:** ${userTruth.doneCount} Done | ${userTruth.failedCount} Failed`;

		return new EmbedBuilder()
			.setTitle('truth!')
			.setDescription(truthText)
			.setColor('#6A5ACD')
			.setFooter({ text: `Requested by ${userTruth.username} | Created By ${creator.username} | #${truth.id}`, iconURL: userTruth.image });
	}

	createActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('truth_done')
					.setLabel('DONE')
					.setStyle(ButtonStyle.Success), // Green button
				new ButtonBuilder()
					.setCustomId('truth_failed')
					.setLabel('FAILED')
					.setStyle(ButtonStyle.Danger), // Red button
				new ButtonBuilder()
					.setCustomId('truth_skip')
					.setLabel('SKIP')
					.setStyle(ButtonStyle.Secondary), // Red button
			);
	}

	createSkippedActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('truth_skipped')
					.setLabel('SKIPPED')
					.setDisabled(true)
					.setStyle(ButtonStyle.Secondary), // Red button
			);
	}

	createPassedActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('truth_done')
					.setLabel('PASSED')
					.setDisabled(true)
					.setStyle(ButtonStyle.Success), // Green button
			);
	}

	createFailedActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('truth_failed')
					.setLabel('FAILED')
					.setDisabled(true)
					.setStyle(ButtonStyle.Danger), // Red button
			);
	}

	/**
	 * 
	 * @param {*} messageId 
	 * @param {*} userId 
	 * @param {*} truthId 
	 * @param {*} serverId 
	 * @param {*} username 
	 * @param {*} image 
	 * @deprecated use saveQuestionMessageId instead
	 **/
	async saveTruthMessageId(messageId, userId, truthId, serverId, username, image) {
		if (!messageId) {
			await interaction.channel.send("I'm sorry, I couldn't save the truth to track votes. This is a brain fart. Please reach out for support on the official server.");
			logger.error(`Brain Fart: Couldn't save truth to track votes. Message ID missing`);
		} else {
			const userTruth = new UserTruth(messageId, userId, truthId, serverId, username, image);
			// Assuming userTruth.save() is an asynchronous operation to save the data
			await userTruth.save();
		}
	}

	/**
	 * 
	 * @param {Interaction} interaction 
	 * @returns 
	 */
	async vote(interaction) {
		if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });
		const userTruth = await new UserTruth().load(interaction.message.id, 'truth');

		if (!userTruth) {
			await interaction.editReply("I'm sorry, I couldn't find the truth to track votes. This is a brain fart. Please reach out for support on the official server.");
			logger.error(`Brain Fart: Couldn't find truth to track votes. Message ID missing`);
			return;
		}

		//load the user		
		/** @type {User} */
		const user = await userTruth.getUser();
		await user.loadServerUser(interaction.guildId);
		//load the server
		const server = new Server(interaction.guildId);
		await server.load();

		const truthUser = userTruth.getUserId();

		if (interaction.customId === 'truth_skip') {
			this.doSkip(interaction, userTruth, truthUser, user);
		} else {
			this.doVote(interaction, userTruth, truthUser, user, server)
		}

	}
	/**
	 * 
	 * @param {Interaction} interaction 
	 * @param {userTruth} userTruth 
	 * @param {string} truthUser 
	 * @param {User} user 
	 * @returns 
	 */
	async doSkip(interaction, userTruth, truthUser, user) {

		if (truthUser != interaction.user.id) {
			interaction.editReply({ content: "You can't skip someone else's truth!", ephemeral: true });
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
				new ButtonBuilder()
					.setStyle(ButtonStyle.Premium)
					.setSKUId(purchasable.skuId)
			);
			interaction.editReply(
				{
					content: "Uh oh! You're out of Skips!\nNot to worry, You can earn up to 10 skips by voting for the bot every day on [top.gg](https://top.gg/bot/1079207025315164331/vote)! \n\nYou can also buy 10 skips right now by clicking the button below! (the 10 skip limit does not apply to purchased skips)",
					components: [row],
					flags: MessageFlags.Ephemeral
				});
			return;
		}

		const embed = await this.createUpdatedTruthEmbed(userTruth, interaction);
		const row = await this.createSkippedActionRow();

		//use the userTruth.messageId to edit the embed in the message
		await interaction.message.edit({ embeds: [embed], components: [row] });
		await user.burnVote();
		await interaction.editReply({ content: `Your truth has been skipped! You have ${user.voteCount} skips remaining!`, ephemeral: true });



	}


	async doVote(interaction, userTruth, truthUser, user, server) {

		if (truthUser == interaction.user.id && !this.ALPHA) {
			interaction.editReply({ content: "You can't vote on your own truth!", ephemeral: true });
			return;
		}

		const vote = interaction.customId === 'truth_done' ? 'done' : 'failed';

		const couldVote = await userTruth.vote(interaction.user.id, vote);
		if (!couldVote && !this.ALPHA) {
			await interaction.editReply({ content: "You've already voted on this truth!", ephemeral: true });
			return;
		}

		const embed = await this.createUpdatedTruthEmbed(userTruth, interaction);

		let row = this.createActionRow();

		if (userTruth.doneCount >= this.vote_count) {
			row = this.createPassedActionRow();

			user.addXP(this.successXp);
			user.addServerXP(server.truth_success_xp);

		} else if (userTruth.failedCount >= this.vote_count) {
			row = this.createFailedActionRow();

			user.subtractXP(this.failXp);
			user.subtractServerXP(server.truth_fail_xp);

		}

		//use the userTruth.messageId to edit the embed in the message
		await interaction.message.edit({ embeds: [embed], components: [row] });
		await interaction.editReply({ content: "Your vote has been recorded!", ephemeral: true });
	}

	/**
 * mark the truth as approved or banned
 * @param {Interaction} interaction 
 * @param {string<"ban"|"approve">} decision 
 */
	async setTruth(interaction, decision) {
		if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });
		let truth = await new Truth().find(interaction.message.id);
		switch (decision) {
			case "ban":
				this.getBanReason(interaction, truth.id);
				break;
			case 'unban':
				await truth.unBan();
				logger.updateTruth(truth);
				interaction.editReply("Truth has been Unbanned");
				break;
			case "approve":
				this.approve(interaction, truth);
				break;
		}

	}
}

module.exports = TruthHandler;