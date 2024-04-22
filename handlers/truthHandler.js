const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, WebhookClient } = require('discord.js');

const Handler = require('./handler.js')
const Question = require('../objects/question.js');
const { exit } = require('process');
const UserTruth = require('../objects/userTruth.js');
client = null;

class TruthHandler extends Handler {

	successXp = 40;
	failXp = 40;

	constructor(client) {
		super()
		this.client = client
	}

	createTruth(interaction) {
		const question = new Question(interaction.options.getString('text'), interaction.user.id);
		if (!question.question) {
			interaction.reply("You need to give me a truth!");
			webhookClient.send(`Aborted Truth creation: Nothing Given`);

			return;
		}
		this.db.list("truths").then((truths) => {
			if (truths.some(q => q.question === question.question)) {
				interaction.reply("This truth already exists!");
				const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_COMMAND_URL });
				webhookClient.send(`Aborted Truth creation: Already exists`);
				return;
			} else {
				this.db.set("truths", question).then((data) => {
					const embed = new EmbedBuilder()
						.setTitle('New Truth Created!')
						.setDescription(question.question)
						.setColor('#00ff00')
						.setFooter({ text: ' Created by ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() });
					interaction.reply("Thank you for your submission. A member of the moderation team will review your truth shortly")
					interaction.channel.send({ embeds: [embed] });
					const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_CREATIONS_URL });

					webhookClient.send(`**Truth Created** | **server**: ${interaction.guild.name} \n- **Truth**: ${question.question} \n- **ID**: ${data.insertId}`);
					
				});
			}
		});
	}

	async truth(interaction) {
		try{
		const truths = await this.db.list("truths")
			if(!truths || truths.length === 0) { interaction.reply("Hmm, I can't find any truths. This might be a bug, try again later"); return; }
			const unBannedQuestions = truths.filter(q => !q.isBanned);
			const truth = this.selectRandomTruth(unBannedQuestions);
			const creator = this.getCreator(truth, this.client);

			const embed = this.createTruthEmbed(truth, interaction, creator);
			const row = this.createActionRow();

			const message = await interaction.reply({ content: "Here's your Truth!", embeds: [embed], components: [row], fetchReply: true });
			await this.saveTruthMessageId(message.id, interaction.user.id, truth.id, interaction.user.username, interaction.user.displayAvatarURL());
		} catch (error) {
			console.error('Error in truth function:', error);
			interaction.reply("Woops! Brain Fart! Try another Command while I work out what went Wrong :thinking:");
			const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_FARTS_URL });
			await webhookClient.send(`Brain Fart: Error in truth function: ${error}`);
		}
	}

	giveTruth(interaction) {
		const user = interaction.options.getUser('user');
		const truth = interaction.options.getString('truth');

		// Send an error message if no user was mentioned
		if (!user) {
			interaction.reply('Please mention a user to ask!');
			return;
		}

		// Send an error message if no question was provided
		if (!truth) {
			interaction.reply('Please provide a Question!');
			return;
		}

		// Construct the message to send
		const messageText = `${user}, ${interaction.user} has asked you ${truth}!\n Remember to answer honestly :P`;

		// Create an embed with the message and send it
		const embed = new EmbedBuilder()
			.setTitle("Answer Honestly!")
			.setDescription(messageText)
			.setColor('#6A5ACD')


		interaction.reply({ embeds: [embed] });
	}

	async listAll(interaction) {
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

	ban(interaction) {
		let id = interaction.options.getInteger("id");
		let truth = this.db.get("truths", id);
		if (!truth) { interaction.reply("Truth not found"); return; }

		truth.isBanned = 1;
		this.db.set('truths', Truth);
		interaction.reply("Truth " + id + " has been banned!");
	}

	selectRandomTruth(truths) {
		const random = Math.floor(Math.random() * truths.length);
		return truths[random];
	}

	getCreator(truth, client) {
		let creator = client.users.cache.get(truth.creator);
		return creator || { username: "Somebody" };
	}

	createTruthEmbed(truth, interaction, creator) {

		let truthText = `${truth.question}\n\n **Votes:** 0 Done | 0 Failed`;

		return new EmbedBuilder()
			.setTitle('truth!')
			.setDescription(truthText)
			.setColor('#6A5ACD')
			.setFooter({ text: `Requested by ${interaction.user.username} | Created By ${creator} | #${truth.id}`, iconURL: interaction.user.displayAvatarURL() });
	}

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

	async saveTruthMessageId(messageId, userId, truthId, username, image) {
		if (!messageId) {
			await interaction.channel.send("I'm sorry, I couldn't save the truth to track votes. This is a brain fart. Please reach out for support on the official server.");
			const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_FARTS_URL });
			await webhookClient.send(`Brain Fart: Couldn't save truth to track votes. Message ID missing`);
		} else {
			const userTruth = new UserTruth(messageId, userId, truthId, username, image);
			// Assuming userTruth.save() is an asynchronous operation to save the data
			await userTruth.save();
		}
	}

	async vote(interaction) {

		const userTruth = await new UserTruth().load(interaction.message.id, 'truth');

		const truthUser = userTruth.getUserId();
		if (truthUser == interaction.user.id) {
			//await interaction.reply({content: "You can't vote on your own truth!", ephemeral: true});
			//return;
		}

		const vote = interaction.customId === 'truth_done' ? 'done' : 'failed';

		if (!userTruth) {
			await interaction.reply("I'm sorry, I couldn't find the truth to track votes. This is a brain fart. Please reach out for support on the official server.");
			const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_FARTS_URL });
			await webhookClient.send(`Brain Fart: Couldn't find truth to track votes. Message ID missing`);
			return;
		}

		const couldVote = await userTruth.vote(interaction.user.id, vote);
		if(!couldVote) {
			//await interaction.reply({content: "You've already voted on this truth!", ephemeral: true});
			//return;
		}

		const embed = await this.createUpdatedTruthEmbed(userTruth, interaction);

		let row = this.createActionRow();

		if(userTruth.doneCount >= 5) {
			row = this.createPassedActionRow();
			/** @type {User} */
			let user = await userTruth.getUser()
			user.addXP(this.successXp);
			user.save();
		} else if(userTruth.failedCount >= 5) {
			row = this.createFailedActionRow();
			/** @type {User} */
			let user = await userTruth.getUser()
			user.subtractXP(this.failXp);
			user.save();
		}

		//use the userTruth.messageId to edit the embed in the message
		await interaction.message.edit({ embeds: [embed], components: [row]});
		await interaction.reply({ content: "Your vote has been recorded!", ephemeral: true });
	}
}

module.exports = TruthHandler;