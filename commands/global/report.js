const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandNumberOption, SlashCommandStringOption } = require("discord.js");
const ReportService = require('../../services/ReportService');
const logger = require("../../objects/logger"); // Assuming logger is still needed for error logging.

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Report a Dare, Truth, or Server')
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('dare')
            .setDescription('Report the specified Dare')
            .addNumberOption(new SlashCommandNumberOption()
                .setName('id')
                .setRequired(true)
                .setDescription('The ID of the Dare you are reporting')
            )
            .addStringOption(new SlashCommandStringOption()
                .setName('reason')
                .setRequired(true)
                .setDescription('Why are you reporting this Dare?')
            )
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('truth')
            .setDescription('Report the specified Truth')
            .addNumberOption(new SlashCommandNumberOption()
                .setName('id')
                .setRequired(true)
                .setDescription('The ID of the Truth you are reporting')
            )
            .addStringOption(new SlashCommandStringOption()
                .setName('reason')
                .setRequired(true)
                .setDescription('Why are you reporting this Truth?')
            )
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('server')
            .setDescription('Report this Server')
            .addStringOption(new SlashCommandStringOption()
                .setName('reason')
                .setRequired(true)
                .setDescription('Why are you reporting this Server?')
            )
        ),
    nsfw: false,
    administrator: false,
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const reportService = new ReportService();

        try {
            const reportData = {
                type: interaction.options.getSubcommand(),
                reporterId: interaction.user.id,
                offenderId: interaction.options.getSubcommand() === 'server' ? interaction.guildId : interaction.options.getNumber('id'),
                reason: interaction.options.getString('reason'),
                serverId: interaction.guildId,
            };

            // Create the report in the database
            const newReport = await reportService.createReport(reportData);

            if (!newReport) {
                await interaction.editReply("There was an issue saving your report. Please try again later.");
                return;
            }

            // Notify moderators
            await reportService.notifyModerators(newReport, interaction.client);

            await interaction.editReply("Your report has been submitted successfully. Thank you.");

        } catch (error) {
            logger.error(`Failed to execute /report command: ${error.message}`);
            await interaction.editReply("A critical error occurred while submitting your report. The development team has been notified.");
        }
    }
};
