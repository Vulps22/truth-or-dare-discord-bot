const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandNumberOption, SlashCommandStringOption } = require("discord.js");
const Report = require("objects/report"); // Use the new Report class
const logger = require("objects/logger"); // Ensure the logger path is correct

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Report a Dare|Truth|Server')
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

        const subcommand = interaction.options.getSubcommand();
        const reason = interaction.options.getString('reason');
        let offenderId = subcommand === 'server' ? interaction.guildId : interaction.options.getNumber('id');
        
        if(!reason) {
            await interaction.editReply("You must specify a reason. Only you can see this message");
            return;
        }

        //try {
            // Create a new Report instance and save it
            const report = new Report(null, subcommand, interaction.user.id, reason, offenderId);
            report.type = subcommand;
            report.senderId = interaction.user.id;
            report.serverId = interaction.guildId;
            report.reason = reason;
            report.offenderId = offenderId;
            let reportId = await report.save();
            
            // Log the report using the logger
            let questionText = '';
            if (subcommand === 'dare' || subcommand === 'truth') {
                const question = await report.loadOffender();
                questionText = question ? `Question: ${question.question}` : '';
            }

            await logger.newReport(report);

            await interaction.editReply("Your report has been submitted. Only you can see this message.");
        //} catch (error) {
           // console.error(`Failed to submit report: ${error}`);
           // await interaction.editReply("There was an issue submitting your report. Please try again later.");
        //}
    }
};
