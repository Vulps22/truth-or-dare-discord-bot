const { EmbedBuilder, TextDisplayBuilder, SectionBuilder, ContainerBuilder } = require('discord.js');

/**
 * Creates a Discord embed for a new report notification.
 * @param {object} report - The report object from the database.
 * @returns {EmbedBuilder} A Discord embed builder instance.
 */
function ReportViewV1(report) {
    const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('New Report Submitted')
        .addFields(
            { name: 'Report ID', value: `\`${report.id}\``, inline: true },
            { name: 'Type', value: `\`${report.type}\``, inline: true },
            { name: 'Status', value: `\`${report.status}\``, inline: true },
            { name: 'Reason', value: report.reason },
            { name: 'Reporter', value: `<@${report.senderId}> (\`${report.senderId}\`)` },
            { name: 'Offender ID', value: `\`${report.offenderId}\`` },
            { name: 'Server ID', value: `\`${report.serverId}\`` }
        )
        .setTimestamp(new Date(report.created_at));

    // TODO: Add buttons for actions (e.g., Ban User, Ban Question, Clear Report)

    return embed;
}

function ReportView(report) {

    const titleComponent = new TextDisplayBuilder()
    .setContent('# New Report Submitted');

        const reportComponent = new TextDisplayBuilder().setContent(`Report ID: \`${report.id}\`   Type: \`${report.type}\`   Status: \`${report.status}\``);
        const reasonComponent = new TextDisplayBuilder().setContent(`Reason: ${report.reason}`);
        const reporterComponent = new TextDisplayBuilder().setContent(`Reporter: <@${report.senderId}> (\`${report.senderId}\`)`);
        const offenderComponent = new TextDisplayBuilder().setContent(`Offender ID: \`${report.offenderId}\``);
        const serverComponent = new TextDisplayBuilder().setContent(`Server ID: \`${report.serverId}\``);


        const containerComponent = new ContainerBuilder()
        .setAccentColor(ReportColor[report.status?.toUpperCase()]) // fallback to red
        .addTextDisplayComponents([titleComponent, reportComponent, reasonComponent, reporterComponent, offenderComponent, serverComponent]);
            

    return containerComponent;

}

const ReportColor = {
    CLEARED: [0, 255, 0], // Green
    PENDING: [255, 255, 0], // Yellow
    ACTIONED: [255, 0, 0], // Red
}

module.exports = {
    ReportView,
};
