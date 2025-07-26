const { MessageFlags } = require("discord.js");
const { QuestionService } = require("services/QuestionService");
const { ReportService, ReportType, ReportStatus } = require("services/ReportService");
const { BotButtonInteraction } = require("structures/botbuttonInteraction");
const { ReportView } = require("views/moderation/reportView");

module.exports = {
  name: 'report_action-ban',
  /**
   * 
   * @param {BotButtonInteraction} interaction 
   */
  async execute(interaction) {

    console.log('Executing report_action-ban');

    const params = interaction.params;
    const reason = interaction.values[0];
    const reportId = params.get('id');
    const reportService = new ReportService();
    const report = await reportService.getReportById(reportId);
    if (!report) {
      return interaction.reply({ content: 'Report not found.' });
    }

    report.banReason = reason;
    report.moderatorId = interaction.user.id;
    await reportService.updateReport(report);
    await interaction.reply({ content: `Report actioned with reason: ${reason}`, ephemeral: true });

    let didBan = false;

    switch (report.type) {
      case ReportType.QUESTION:
      case ReportType.TRUTH:
      case ReportType.DARE:
        didBan = await banQuestion(report);
        break;

      case ReportType.USER:
      case ReportType.SERVER:
        interaction.reply({ content: 'Not Implemented: Ask a developer to do this manually.' });
        didBan = false;
        break;
    }

    if (didBan) {
      report.status = ReportStatus.ACTIONED;
      await reportService.updateReport(report);
      await interaction.message.edit({ components: ReportView(report), flags: MessageFlags.IsComponentsV2 });
      return;
    }

  }
}

/**
 * Ban a question based on the report details.
 * @param {Object} report - The report object containing details about the reported question.
 * @returns {Promise<boolean>} - Returns true if the question was banned successfully, false otherwise.
 */
async function banQuestion(report) {
  const questionService = new QuestionService();
  const questionId = report.offenderId;
  const didBan = await questionService.banQuestion(questionId, report.banReason, report.moderatorId);
  if (didBan) {
    console.log(`Question with ID ${questionId} has been banned for reason: ${report.banReason}`);
  } else {
    console.error(`Failed to ban question with ID ${questionId}`);
  }

  return didBan;

}