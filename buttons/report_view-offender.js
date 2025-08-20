const { MessageFlags } = require('discord.js');
const { QuestionService } = require('services/QuestionService');
const { ReportService, ReportType } = require('services/ReportService');
const { QuestionView } = require('views/questionView');

module.exports = {
  name: 'report_view-offender',
  /**
   * 
   * @param {import('structures/botbuttonInteraction').BotButtonInteraction} interaction 
   */
  async execute(interaction) {
    const reportId = interaction.params.get('id');

    const reportService = new ReportService();
    const report = await reportService.getReportById(reportId);
    if (!report) {
      return interaction.ephemeralReply('Report Not Found.');
    }
    const offenderId = report.offenderId;

    switch (report.type) {
      case ReportType.QUESTION:
      case ReportType.DARE:
      case ReportType.TRUTH:
        await showQuestionOffender(interaction, offenderId);
        break;
      default:
        return interaction.ephemeralReply('This report type does not have an offender.');
    }


  }
};


async function showQuestionOffender(interaction, offenderId) {
  const questionService = new QuestionService();
  const question = await questionService.getQuestionById(offenderId);
  if (!question) {
    return interaction.ephemeralReply('Question Not Found.');
  }
    await interaction.ephemeralReply({ 
    components: QuestionView(question, true), 
    flags: MessageFlags.IsComponentsV2 
  });
}