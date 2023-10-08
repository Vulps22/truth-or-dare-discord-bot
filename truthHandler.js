const { EmbedBuilder, Embed, Client } = require('discord.js');

const Handler = require('./handler.js')
const Question = require('./question.js');
client = null;

class TruthHandler extends Handler {


	constructor(client) {
		super()
		this.client = client
	}

	createTruth(interaction) {
		const question = new Question(interaction.options.getString('text'), interaction.user.id);
		if (!question.question) {
			interaction.reply("You need to give me a truth!");
			return;
		}
		this.db.list("truths").then((truths) => {
			if (truths.some(q => q.question === question.question)) {
				interaction.reply("This truth already exists!");
				return;
			} else {
				this.db.set("truths", question).then(() => {
					const embed = new EmbedBuilder()
						.setTitle('New Truth Created!')
						.setDescription(question.question)
						.setColor('#00ff00')
						.setFooter({ text: ' Created by ' + interaction.user.username + ' | ' + 'ID: #' + truths.length, iconURL: interaction.user.displayAvatarURL() });
					interaction.reply("Thank you for your submission. A member of the moderation team will review your truth shortly")
					interaction.channel.send({ embeds: [embed] });
				});
			}
		});
	}

	truth(interaction) {
		this.db.list("truths").then((truths) => {
			if(!truths || truth.length === 0) interaction.reply("Hmm, I can't find any truths. This might be a bug, try again later");
			const unBannedQuestions = truths.filter(q => !q.isBanned);
			const random = Math.floor(Math.random() * unBannedQuestions.length);
			const truth = unBannedQuestions[random];

			let creator = this.client.users.cache.get(truth.creator);
			if (creator === undefined) creator = { username: "Somebody" };

			const embed = new EmbedBuilder()
				.setTitle('Truth!')
				.setDescription(truth.question)
				.setColor('#6A5ACD')
				.setFooter({ text: `Requested by ${interaction.user.username} | Created By ${creator.username} | #${random}`, iconURL: interaction.user.displayAvatarURL() });
			interaction.reply("Here's your Truth!")
			interaction.channel.send({ embeds: [embed] });
		});
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
}

module.exports = TruthHandler;