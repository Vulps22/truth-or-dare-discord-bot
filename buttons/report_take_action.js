
const { MessageFlags } = require("discord.js");
const { ReportService, ReportStatus} = require("services/ReportService");
const { BotButtonInteraction } = require("structures/botbuttonInteraction");
const { ReportView } = require("views/moderation/reportView");

module.exports = {
    name: 'report_take-action',
    /**
     * 
     * @param {BotButtonInteraction} interaction 
     */
    async execute(interaction) {
        const reportService = new ReportService();
        const params = interaction.params;
        const reportId = params.get('id');

        const report = await reportService.getReportById(reportId);
        
        if (!report) {
           return interaction.reply({ content: 'Report not found.', ephemeral: true });
        }

        report.status = ReportStatus.ACTIONING;
        await reportService.updateReport(report);

        //get the message the button was clicked on
        const channel = interaction.channel;
        const message = await channel.messages.fetch(interaction.messageId);
        message.edit({components: ReportView(report), flags: MessageFlags.IsComponentsV2 });
    }
};
