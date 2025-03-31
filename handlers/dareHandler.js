const { Interaction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Guild, MessageFlags } = require('discord.js');

const Handler = require('handlers/handler.js')
const UserDare = require('objects/userDare.js');
const User = require('objects/user.js');
const Server = require('objects/server.js');
const Dare = require('objects/dare.js');
const logger = require('objects/logger.js');
const Question = require('objects/question.js');
const GivenQuestion = require('objects/givenQuestion.js');
const Purchasable = require('objects/purchasable');
let client = null
class DareHandler extends Handler {

	successXp = 50;
	failXp = 25; //this is subtracted from the user's xp when they fail a dare

	constructor(client) {
		super("dare")
		this.client = client
	}

	/**
	 * 
	 * @param {Interaction} interaction 
	 * @returns 
	 */
	async createDare(interaction) {

		const dare = new Dare();

		dare.question = interaction.options.getString('text');
		if (!dare.question) {
			interaction.editReply("You need to give me a dare!");
			logger.error(`Aborted Dare creation: Nothing Given`);
			return;
		}
		let dares = await this.db.list("dares");
		if (dares.some(q => q.question === dare.question)) {
			interaction.editReply("This dare already exists!");
			logger.error(`Aborted Dare creation: Already exists`);
			return;
		} else {
			let createdDare = await dare.create(interaction.options.getString('text'), interaction.user.id, interaction.guildId);

			const embed = new EmbedBuilder()
				.setTitle('New Dare Created!')
				.setDescription(dare.question)
				.setColor('#00ff00')
				.setFooter({ text: ' Created by ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

			const now = new Date();
			//Moderators will be on holiday between 22/12 and 02/01
			if ((now.getMonth() == 11 && now.getDate() >= 22) || (now.getMonth() == 0 && now.getDate() == 1)) {
				//send a christmas message
				interaction.editReply({ content: "Thank you for your submission. Our excellent and dedicated team of moderators have decided to take christmas off from moderation.\n Your submission will be reviewed when they return on the 2nd of January\n\n Merry Christmas 🎄" });

			} else {
				//Not Christmas
				interaction.editReply({ content: "Thank you for your submission. A member of the moderation team will review your dare shortly" });
			}
			interaction.channel.send({ embeds: [embed] });

			logger.newDare(createdDare);
		}
	}

	/**
	 * 
	 * @param {Interaction} interaction 
	 * @returns 
	 * @deprecated Use getQuestion instead
	 */

	async dare(interaction) {
		if (!interaction.deferred) await interaction.deferReply();
		try {
			const dares = await Question.collect('dare');
			if (!dares || dares.length === 0) {
				return interaction.editReply("Hmm, I can't find any dares. This might be a bug, try again later");
			}

			const unBannedQuestions = dares.filter(q => !q.isBanned && q.isApproved);
			if (unBannedQuestions.length === 0) { interaction.editReply("There are no approved truths to give"); return; }
			const dare = this.selectRandom(unBannedQuestions);

			const creator = await this.getCreator(dare, interaction);
			const username = creator.username ?? "Somebody";

			const embed = this.createQuestionEmbed(dare, interaction, username);
			const row = this.createActionRow();

			const message = await interaction.editReply({ content: "Here's your Dare!", embeds: [embed], components: [row], fetchReply: true });
			await this.saveQuestionMessageId(message.id, interaction.user.id, dare.id, interaction.guildId, interaction.user.username, interaction.user.displayAvatarURL());
		} catch (error) {
			console.error('Error in dare function:', error);
			interaction.editReply("Woops! Brain Fart! Try another Command while I work out what went Wrong :thinking:");
			logger.error(`Brain Fart: Error in dare function: ${error}`);
		}
	}
	/**
	 * 
	 * @param {Interaction} interaction 
	 * @returns 
	 * @deprecated Use giveQuestion instead
	 */
	async giveDare(interaction) {
		if (!interaction.deferred) await interaction.deferReply();
		const target = interaction.options.getUser('user');
		const question = interaction.options.getString('dare');
		const wager = interaction.options.getInteger('wager');
		const xpType = interaction.options.getString('type');

		// Send an error message if no user was mentioned
		if (!target) {
			interaction.editReply('Please mention a user to give a dare to!');
			return;
		}

		// Send an error message if no dare was provided
		if (!question) {
			interaction.editReply('Please provide a dare!');
			return;
		}

		if (wager < 1) {
			interaction.editReply('You must offer a wager');
			return;
		}
		const given = GivenQuestion.create(interaction, question, interaction.user.id, target.id, interaction.guildId, wager, xpType, "dare");
		interaction.editReply({ content: "Your dare has been sent", ephemeral: true });
	}

	async listAll(interaction) {
		await this.db.list("dares").then((dares) => {

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

	/**
	 * 
	 * @param {Dare[]} dares 
	 * @returns 
	 * @deprecated Use selectRandom instead
	 */
	selectRandomDare(dares) {
		const random = Math.floor(Math.random() * dares.length);
		return dares[random];
	}

	/**
	 * @deprecated Use createQuestionEmbed instead
	 * @param {Dare} dare
	 * @param {Interaction} interaction
	 * @param {string} username
	 * @returns {EmbedBuilder}
	 */
	createDareEmbed(dare, interaction, username) {

		let dareText = `${dare.question}\n\n **Votes:** 0 Done | 0 Failed`;

		return new EmbedBuilder()
			.setTitle('Dare!')
			.setDescription(dareText)
			.setColor('#6A5ACD')
			.setFooter({ text: `Requested by ${interaction.user.username} | Created By ${username} | #${dare.id}`, iconURL: interaction.user.displayAvatarURL() });
	}
	/**
	 * 
	 * @param {UserDare} userDare 
	 * @param {Interaction} interaction 
	 * @returns 
	 * @deprecated Use createUpdatedQuestionEmbed instead
	 */
	async createUpdatedDareEmbed(userDare, interaction) {
		let dare = await userDare.getQuestion();
		let question = dare.question;
		let creator = this.getCreator(dare, interaction);
		const username = (await creator).username;

		let dareText = `${question}\n\n **Votes:** ${userDare.doneCount} Done | ${userDare.failedCount} Failed`;

		return new EmbedBuilder()
			.setTitle('Dare!')
			.setDescription(dareText)
			.setColor('#6A5ACD')
			.setFooter({ text: `Requested by ${userDare.username} | Created By ${username} | #${dare.id}`, iconURL: userDare.image });
	}

	createActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('dare_done')
					.setLabel('DONE')
					.setStyle(ButtonStyle.Success), // Green button
				new ButtonBuilder()
					.setCustomId('dare_failed')
					.setLabel('FAILED')
					.setStyle(ButtonStyle.Danger), // Red button
				new ButtonBuilder()
					.setCustomId('dare_skip')
					.setLabel('SKIP')
					.setStyle(ButtonStyle.Secondary), // Red button
			);
	}

	createPassedActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('dare_done')
					.setLabel('PASSED')
					.setDisabled(true)
					.setStyle(ButtonStyle.Success), // Green button
			);
	}

	createFailedActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('dare_failed')
					.setLabel('FAILED')
					.setDisabled(true)
					.setStyle(ButtonStyle.Danger), // Red button
			);
	}

	createSkippedActionRow() {
		return new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('dare_skipped')
					.setLabel('SKIPPED')
					.setDisabled(true)
					.setStyle(ButtonStyle.Secondary), // Red button
			);
	}

	/**
	 * 
	 * @param {*} messageId 
	 * @param {*} userId 
	 * @param {*} dareId 
	 * @param {*} serverId 
	 * @param {*} username 
	 * @param {*} image 
	 * @deprecated use saveQuestionMessageId instead
	 */
	async saveDareMessageId(messageId, userId, dareId, serverId, username, image) {
		if (!messageId) {
			await interaction.channel.send("I'm sorry, I couldn't save the dare to track votes. This is a brain fart. Please reach out for support on the official server.");
			logger.error(`Brain Fart: Couldn't save dare to track votes. Message ID missing`);
		} else {
			const userDare = new UserDare(messageId, userId, dareId, serverId, username, image);
			// Assuming userDare.save() is an asynchronous operation to save the data
			await userDare.save();
		}
	}

	/**
	 * 
	 * @param {Interaction} interaction 
	 * @returns 
	 */
	async vote(interaction) {
		if (!interaction.deferred) await interaction.deferReply({ content: "Registering your vote", ephemeral: true })
		const userDare = await new UserDare().load(interaction.message.id, 'dare');

		if (!userDare) {
			await interaction.editReply("I'm sorry, I couldn't find the dare to track votes. This is a brain fart. Please reach out for support on the official server.");
			logger.error(`Brain Fart: Couldn't find dare to track votes. Message ID missing`);
			return;
		}

		//load the user		
		/** @type {User} */
		const user = await userDare.getUser();
		const serverUserLoaded = await user.loadServerUser(interaction.guildId);

		if (!serverUserLoaded) {
			await interaction.editReply("Failed to load server user data. Please try again.");
			logger.error(`Failed to load server user data for user ${user.id} in server ${interaction.guildId}`);
			return;
		}

		//load the server
		const server = new Server(interaction.guildId);
		await server.load();

		const dareUser = userDare.getUserId();

		if (interaction.customId === 'dare_skip') {
			this.doSkip(interaction, userDare, dareUser, user);
		} else {
			this.doVote(interaction, userDare, dareUser, user, server)
		}

	}
	/**
	 * 
	 * @param {Interaction} interaction 
	 * @param {UserDare} userDare 
	 * @param {string} dareUser 
	 * @param {User} user 
	 * @returns 
	 */
	async doSkip(interaction, userDare, dareUser, user) {

		if (dareUser != interaction.user.id) {
			interaction.editReply({ content: "You can't skip someone else's dare!", ephemeral: true });
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
					content: "Uh oh! You're out of Skips!\nNot to worry, You can earn up to 10 skips by voting for the bot every day on [top.gg](https://top.gg/bot/1079207025315164331/vote)!",
					components: [row],
					flags: MessageFlags.Ephemeral
				});
			return;
		}

		const embed = await this.createUpdatedDareEmbed(userDare, interaction);
		const row = await this.createSkippedActionRow();

		//use the userDare.messageId to edit the embed in the message
		await interaction.message.edit({ embeds: [embed], components: [row] });
		await user.burnVote();
		await interaction.editReply({ content: `Your truth has been skipped! You have ${user.voteCount} skips remaining!`, ephemeral: true });

	}

	/**
	 * 
	 * @param {Interaction} interaction 
	 * @param {UserDare} userDare 
	 * @param {String} dareUser 
	 * @param {User} user 
	 * @param {Server} server 
	 * @returns 
	 */
	async doVote(interaction, userDare, dareUser, user, server) {

		if (dareUser == interaction.user.id && !this.ALPHA) {
			interaction.editReply({ content: "You can't vote on your own dare!", ephemeral: true });
			return;
		}

		const vote = interaction.customId === 'dare_done' ? 'done' : 'failed';

		const couldVote = await userDare.vote(interaction.user.id, vote);
		if (!couldVote && !this.ALPHA) {
			await interaction.editReply({ content: "You've already voted on this dare!", ephemeral: true });
			return;
		}

		const embed = await this.createUpdatedDareEmbed(userDare, interaction);

		let row = this.createActionRow();

		if (userDare.doneCount >= this.vote_count) {
			row = this.createPassedActionRow();

			user.addXP(this.successXp);
			user.addServerXP(server.dare_success_xp);

		} else if (userDare.failedCount >= this.vote_count) {
			row = this.createFailedActionRow();

			user.subtractXP(this.failXp);
			user.subtractServerXP(server.dare_fail_xp);
		}

		//use the userDare.messageId to edit the embed in the message
		await interaction.message.edit({ embeds: [embed], components: [row] });
		await interaction.editReply({ content: "Your vote has been recorded!", ephemeral: true });
	}

	/**
	 * mark the dare as approved or banned
	 * @param {Interaction} interaction 
	 * @param {string<"ban"|"approve"} decision 
	 */
	async setDare(interaction, decision) {
		if (!interaction.deferred) await interaction.deferReply({ ephemeral: true })
		let dare = await new Dare().find(interaction.message.id);
		switch (decision) {
			case "ban":
				this.getBanReason(interaction, dare.id);
				break;
			case 'unban':
				await dare.unBan();
				logger.updateDare(dare);
				interaction.editReply("Truth has been Unbanned");
				break;
			case "approve":
				this.approve(interaction, dare);
				break;
		}

	}

}

module.exports = DareHandler;