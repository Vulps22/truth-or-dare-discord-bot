const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandNumberOption, SlashCommandStringOption } = require("discord.js");
const Database = require("../../database");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('report')
		.setDescription('Report a Dare|Truth|Guild')
		.setNSFW(true)
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('dare')
			.setDescription('Report the specified Dare')
			.addNumberOption(new SlashCommandNumberOption()
				.setName('id')
				.setDescription('The ID of the Dare you are reporting')
			)
			.addStringOption(new SlashCommandStringOption()
				.setName('reason')
				.setDescription('Why are you reporting this Truth?')
			)
		)
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('truth')
			.setDescription('Report the specified Truth')
			.addNumberOption(new SlashCommandNumberOption()
				.setName('id')
				.setDescription('The ID of the Truth you are reporting')
			)
			.addStringOption(new SlashCommandStringOption()
				.setName('reason')
				.setDescription('Why are you reporting this Truth?')
			)
		)
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName('server')
			.setDescription('Report this Server')
			.addStringOption(new SlashCommandStringOption()
				.setName('reason')
				.setDescription('Why are you reporting this Server?')
			)
		),
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
		const reason = interaction.options.getString('reason');
		if (!reason) {
			interaction.reply({
				content: 'You must specify a reason. Only you can see this message',
				ephemeral: true
			});
			return;
		}

		let offender = 0;

		if (subcommand === 'server') offender = interaction.guildId
		else offender = interaction.options.getNumber('id');

		const db = new Database();
		db.set('reports', {
			type: (subcommand === 'server') ? 'guild' : subcommand,
			sender: interaction.user.id,
			reason: reason,
			offenderId: offender
		}).then(() => {
			interaction.reply({
				content: "Your report has been submitted. Only you can see this message.",
				ephemeral: true
			})
		})
	}
}