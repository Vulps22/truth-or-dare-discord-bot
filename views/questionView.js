const { TextDisplayBuilder, ContainerBuilder, ButtonStyle } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder } = require('node_modules/@discordjs/builders/dist');

/**
 * Creates a Discord embed for displaying question details.
 * @param {object} question - The question object from the database.
 * @param {boolean} [moderating=false] - Whether the view is for moderation purposes.
 * @returns {Array} Array containing [ContainerBuilder, ActionRowBuilder] for Components V2.
 */
function QuestionView(question, moderating = false) {
    const titleComponent = new TextDisplayBuilder()
        .setContent('# Question Details');

    const idComponent = new TextDisplayBuilder()
        .setContent(`**Question ID:** \`${question.id}\``);

    const typeComponent = new TextDisplayBuilder()
        .setContent(`**Type:** \`${question.type}\``);

    const creatorComponent = new TextDisplayBuilder()
        .setContent(`**Creator:** <@${question.creator}> (\`${question.creator}\`)`);

    const serverComponent = new TextDisplayBuilder()
        .setContent(`**Server ID:** \`${question.serverId}\``);

    const questionTextComponent = new TextDisplayBuilder()
        .setContent(`**Question:** ${question.question || question.text || 'No question text available'}`);

    // Base components that are always shown
    const components = [titleComponent, idComponent, typeComponent, creatorComponent, serverComponent, questionTextComponent];

    // Approval status
    if (question.isApproved) {
        const approvalComponent = new TextDisplayBuilder()
            .setContent(`**✅ Status:** Approved`);
        components.push(approvalComponent);

        if (question.approvedBy) {
            const approvedByComponent = new TextDisplayBuilder()
                .setContent(`**Approved By:** <@${question.approvedBy}> (\`${question.approvedBy}\`)`);
            components.push(approvedByComponent);
        }
    } else {
        const approvalComponent = new TextDisplayBuilder()
            .setContent(`**⏳ Status:** Pending Approval`);
        components.push(approvalComponent);
    }

    // Ban status
    if (question.isBanned) {
        const banStatusComponent = new TextDisplayBuilder()
            .setContent(`**🚫 Banned:** Yes`);
        components.push(banStatusComponent);

        if (question.bannedBy) {
            const bannedByComponent = new TextDisplayBuilder()
                .setContent(`**Banned By:** <@${question.bannedBy}> (\`${question.bannedBy}\`)`);
            components.push(bannedByComponent);
        }

        if (question.banReason) {
            const banReasonComponent = new TextDisplayBuilder()
                .setContent(`**Ban Reason:** ${question.banReason}`);
            components.push(banReasonComponent);
        }
    }

    // Determine container color based on status
    let accentColor;
    if (question.isBanned) {
        accentColor = [255, 0, 0]; // Red for banned
    } else if (question.isApproved) {
        accentColor = [0, 255, 0]; // Green for approved
    } else {
        accentColor = [255, 255, 0]; // Yellow for pending
    }

    const containerComponent = new ContainerBuilder()
        .setAccentColor(accentColor)
        .addTextDisplayComponents(components);

    let actionRow;
    if (!moderating) {
        // Action buttons
        actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`question_report_id:${question.id}`)
                    .setLabel('Report Question')
                    .setStyle(ButtonStyle.Danger)
            );
    } else {
        if (question.isApproved) {
            actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`question_ban_id:${question.id}`)
                        .setLabel('Ban Question')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true), // Disable me when implemented
                );
        } else if (!question.isApproved && !question.isBanned) {
            actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`question_approve_id:${question.id}`)
                        .setLabel('Approve Question')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true), // Disable me when implemented
                    new ButtonBuilder()
                        .setCustomId(`question_ban_id:${question.id}`)
                        .setLabel('Ban Question')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true) // Disable me when implemented
                );
        } else if (question.isBanned) {
            actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`question_unban_id:${question.id}`)
                        .setLabel('Unban Question')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true), //Disable me when implemented
                );
        }

        if (!actionRow || actionRow === undefined) {
            actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`question_report_id:${question.id}`)
                        .setLabel('Report Question')
                        .setStyle(ButtonStyle.Danger)
                );
        }
    }

    return [containerComponent, actionRow];
}

module.exports = {
    QuestionView,
};
