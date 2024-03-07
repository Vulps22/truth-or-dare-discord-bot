const { EmbedBuilder, WebhookClient } = require('discord.js');

const Handler = require('./handler.js')
const Question = require('./question.js');
client = null
class DareHandler extends Handler {

	constructor(client) {
		super()
		this.client = client
	}

	createDare(interaction) {
		const question = new Question(interaction.options.getString('text'), interaction.user.id);
		if (!question.question) {
			interaction.reply("You need to give me a dare!");
			const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_COMMAND_URL });
			webhookClient.send(`Aborted Dare creation: Nothing Given`);
			return;
		}
		this.db.list("dares").then((dares) => {
			if (dares.some(q => q.question === question.question)) {
				interaction.reply("This dare already exists!");
				const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_COMMAND_URL });
				webhookClient.send(`Aborted Dare creation: Already exists`);
				return;
			} else {
				this.db.set("dares", question).then((data) => {
					const embed = new EmbedBuilder()
						.setTitle('New Dare Created!')
						.setDescription(question.question)
						.setColor('#00ff00')
						.setFooter({ text: ' Created by ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() });
					interaction.reply("Thank you for your submission. A member of the moderation team will review your dare shortly")
					interaction.channel.send({ embeds: [embed] });

					const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_CREATIONS_URL });
					webhookClient.send(`**Dare Created** | **server**: ${interaction.guild.name} \n- **Dare**: ${question.question} \n- **ID**: ${data.insertId}`);
				});
			}
		});
	}

	dare(interaction) {
		this.db.list("dares").then((dares) => {
			if (!dares || dares.length === 0) { interaction.reply("Hmm, I can't find any dares. This might be a bug, try again later"); return; }
			const unBannedQuestions = dares.filter(q => !q.isBanned);
			const random = Math.floor(Math.random() * unBannedQuestions.length);
			const dare = unBannedQuestions[random];

			let creator = this.client.users.cache.get(dare.creator);
			if (creator === undefined) creator = { username: "Somebody" };

			const embed = new EmbedBuilder()
				.setTitle('Dare!')
				.setDescription(dare.question)
				.setColor('#6A5ACD')
				.setFooter({ text: `Requested by ${interaction.user.username} | Created By ${creator.username} | #${dare.id}`, iconURL: interaction.user.displayAvatarURL() });
			interaction.reply("Here's your Dare!")
			interaction.channel.send({ embeds: [embed] });
		});
	}

	giveDare(interaction) {
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


		interaction.reply({ embeds: [embed] });
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
}

module.exports = DareHandler;