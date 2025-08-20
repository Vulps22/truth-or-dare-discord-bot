const { MessageFlags } = require("discord.js");
const { ReportService, ReportStatus } = require("services/ReportService");
const { BotButtonInteraction } = require("structures/botbuttonInteraction");
const { ReportView } = require("views/moderation/reportView");

module.exports = {
  name: 'report_clear',
  /**
   * 
   * @param {BotButtonInteraction} interaction 
   */
  async execute(interaction) {
    const reportId = interaction.params.get('id');
    const reportService = new ReportService();
    const report = await reportService.getReportById(reportId);
    if (!report) {
      return interaction.sendReply(`Report ${reportId} not found.`);
    }

    report.status = ReportStatus.CLEARED; // Set the report status to cleared
    report.moderatorId = interaction.user.id; // Set the moderator who cleared the report
    await reportService.updateReport(report);

    await interaction.message.edit({components: ReportView(report), flags: MessageFlags.IsComponentsV2}); // Update the message with the cleared report view

  }
};
