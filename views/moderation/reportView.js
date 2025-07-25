const { questionBanReasons, userBanReasons, serverBanReasons } = require('constants/banReasons');
const { TextDisplayBuilder, ContainerBuilder, ButtonStyle } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, SelectMenuBuilder } = require('node_modules/@discordjs/builders/dist');

/**
 * Creates a Discord embed for a new report notification.
 * @param {object} report - The report object from the database.
 * @returns {ContainerBuilder} A Discord embed builder instance.
 */

function ReportView(report) {

    const titleComponent = new TextDisplayBuilder()
        .setContent('# New Report Submitted');

    const reportComponent = new TextDisplayBuilder().setContent(`Report ID: \`${report.id}\`   Type: \`${report.type}\`   Status: \`${report.status}\``);
    const reasonComponent = new TextDisplayBuilder().setContent(`Reason: ${report.reason}`);
    const reporterComponent = new TextDisplayBuilder().setContent(`Reporter: <@${report.senderId}> (\`${report.senderId}\`)`);
    const offenderComponent = new TextDisplayBuilder().setContent(`Offender ID: \`${report.offenderId}\``);
    const serverComponent = new TextDisplayBuilder().setContent(`Server ID: \`${report.serverId}\``);

    const actionRow = ReportActionRows[report.status?.toUpperCase()]?.(report);

    const containerComponent = new ContainerBuilder()
        .setAccentColor(ReportColor[report.status?.toUpperCase()]) // fallback to red
        .addTextDisplayComponents([titleComponent, reportComponent, reasonComponent, reporterComponent, offenderComponent, serverComponent])

    return [containerComponent, actionRow];

}

const ReportActionRows = {
    PENDING: (report) => new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('report_clear_id:' + report.id)
                .setLabel('Clear Report')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('report_take-action_id:' + report.id)
                .setLabel('Take Action')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('report_view-offender_id:' + report.id)
                .setLabel('View Offender')
                .setStyle(ButtonStyle.Secondary)
        ),
    ACTIONING: (report) => {

        let banReasons = [];
        switch(report.type) {
            case 'question':
            case 'truth':
            case 'dare':
                banReasons = questionBanReasons;
                break;
            case 'user':
                banReasons = userBanReasons;
                break;
            case 'server':
                banReasons = serverBanReasons;
                break;
        }


        console.log('Ban reasons:', banReasons);

        return new ActionRowBuilder()
            .addComponents(new SelectMenuBuilder()
                .setCustomId('report_action_ban|id:' + report.id)
                .setPlaceholder('Select a reason')
                .addOptions(banReasons)
            )
    },
    ACTIONED: (report) => new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('report_view_offender|id:' + report.id)
                .setLabel('View Offender')
                .setStyle(ButtonStyle.Secondary)
        ),
};

const ReportColor = {
    CLEARED: [0, 255, 0], // Green
    PENDING: [255, 255, 0], // Yellow
    ACTIONED: [255, 0, 0], // Red
}

module.exports = {
    ReportView,
};
