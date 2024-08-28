const { Interaction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Guild } = require('discord.js');

const Handler = require('./handler.js')
const UserDare = require('../objects/userDare.js');
const User = require('../objects/user.js');
const Server = require('../objects/server.js');
const Dare = require('../objects/dare.js');
const Logger = require('../objects/logger.js');
const logger = require('../objects/logger.js');
let client = null
class DareHandler extends Handler {

	successXp = 50;
	failXp = 25; //this is subtracted from the user's xp when they fail a dare

	constructor(client) {
		super("dare")
		this.client = client
	}

	async createDare(interaction) {
		const dare = new Dare();

		dare.question = interaction.options.getString('text');
		if (!dare.question) {
			interaction.reply("You need to give me a dare!");
			logger.error(`Aborted Dare creation: Nothing Given`);
			return;
		}
		let dares = await this.db.list("dares");
		if (dares.some(q => q.question === dare.question)) {
			interaction.reply("This dare already exists!");
			logger.error(`Aborted Dare creation: Already exists`);
			return;
		} else {
			let createdDare = await dare.create(interaction.options.getString('text'), interaction.user.id, interaction.guildId);

			const embed = new EmbedBuilder()
				.setTitle('New Dare Created!')
				.setDescription(dare.question)
				.setColor('#00ff00')
				.setFooter({ text: ' Created by ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() });
			interaction.reply({ content: "Thank you for your submission. A member of the moderation team will review your dare shortly", embeds: [embed] });

			Logger.newDare(createdDare);
		}
	}

	/**
	 * 
	 * @param {Interaction} interaction 
	 * @returns 
	 */

	async dare(interaction) {
		try {
			const dares = await this.db.list("dares");
			if (!dares || dares.length === 0) {
				return interaction.reply("Hmm, I can't find any dares. This might be a bug, try again later");
			}

			const unBannedQuestions = dares.filter(q => !q.isBanned && q.isApproved);
			if (unBannedQuestions.length === 0) { interaction.reply("There are no approved truths to give"); return; }
			const dare = this.selectRandomDare(unBannedQuestions);

			const creator = await this.getCreator(dare, interaction);
			const username = creator.username ?? "Somebody";

			const embed = this.createDareEmbed(dare, interaction, username);
			const row = this.createActionRow();

			const message = await interaction.reply({ content: "Here's your Dare!", embeds: [embed], components: [row], fetchReply: true });
			await this.saveDareMessageId(message.id, interaction.user.id, dare.id, interaction.guildId, interaction.user.username, interaction.user.displayAvatarURL());
		} catch (error) {
			console.error('Error in dare function:', error);
			interaction.reply("Woops! Brain Fart! Try another Command while I work out what went Wrong :thinking:");
			logger.error(`Brain Fart: Error in dare function: ${error}`);
		}
	}

	async giveDare(interaction) {
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


		messageId = await interaction.reply({ embeds: [embed] });
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

	selectRandomDare(dares) {
		const random = Math.floor(Math.random() * dares.length);
		return dares[random];
	}
	/**
	 * Asynchronously gets the creator of a dare from an interaction within a guild.
	 * 
	 * @param {Dare} dare - The dare object with a 'creator' property holding the user ID.
	 * @param {Interaction} interaction - The interaction from which the guild and users are accessed.
	 * @returns {Promise<User>} The user object of the creator or a default user object if not found.
	 */
	async getCreator(dare, interaction) {
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


	createDareEmbed(dare, interaction, username) {

		let dareText = `${dare.question}\n\n **Votes:** 0 Done | 0 Failed`;

		return new EmbedBuilder()
			.setTitle('Dare!')
			.setDescription(dareText)
			.setColor('#6A5ACD')
			.setFooter({ text: `Requested by ${interaction.user.username} | Created By ${username} | #${dare.id}`, iconURL: interaction.user.displayAvatarURL() });
	}

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

	async vote(interaction) {

		const userDare = await new UserDare().load(interaction.message.id, 'dare');

		if (!userDare) {
			await interaction.reply("I'm sorry, I couldn't find the dare to track votes. This is a brain fart. Please reach out for support on the official server.");
			logger.error(`Brain Fart: Couldn't find dare to track votes. Message ID missing`);
			return;
		}

		//load the user		
		/** @type {User} */
		const user = await userDare.getUser();
		await user.loadServerUser(interaction.guildId);
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
			interaction.reply({ content: "You can't skip someone else's dare!", ephemeral: true });
			return;
		}

		if (!user.hasValidVote()) {
			await interaction.reply("Uh oh! You're out of Skips!\nNot to worry, You can earn skips up to 10 by voting for the bot every day on [top.gg](https://top.gg/bot/1079207025315164331/vote)!");
			return;
		}

		const embed = await this.createUpdatedDareEmbed(userDare, interaction);
		const row = await this.createSkippedActionRow();

		//use the userDare.messageId to edit the embed in the message
		await interaction.message.edit({ embeds: [embed], components: [row] });
		await interaction.reply({ content: "Your dare has been skipped! You cannot skip again until you vote", ephemeral: true });

		user.burnVote();

	}


	async doVote(interaction, userDare, dareUser, user, server) {

		if (dareUser == interaction.user.id && !this.ALPHA) {
			interaction.reply({ content: "You can't vote on your own dare!", ephemeral: true });
			return;
		}

		const vote = interaction.customId === 'dare_done' ? 'done' : 'failed';

		const couldVote = await userDare.vote(interaction.user.id, vote);
		if (!couldVote && !this.ALPHA) {
			await interaction.reply({ content: "You've already voted on this dare!", ephemeral: true });
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
		await interaction.reply({ content: "Your vote has been recorded!", ephemeral: true });
	}

	/**
	 * mark the dare as approved or banned
	 * @param {Interaction} interaction 
	 * @param {string<"ban"|"approve"} decision 
	 */
	async setDare(interaction, decision) {
		let dare = await new Dare().find(interaction.message.id);
		switch (decision) {
			case "ban":
				this.getBanReason(interaction, dare.id);
				break;
			case "approve":
				this.approve(interaction, dare);
				break;
		}

	}

}

module.exports = DareHandler;