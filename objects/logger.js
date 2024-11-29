const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, } = require('discord.js');

module.exports = {

    /**
     * 
     * @param {string} message 
     * @returns {Message}
     */
    async log(m) {
        try {
            const messageOptions = { content: m, fetchReply: true };
            const channelId = my.logs; // Assuming `my.logs` contains the channel ID

            // Use sendTo function to send the message to the specified channel
            const messageId = await sendTo(messageOptions, channelId);
            console.log(messageId)
            if (messageId) {
                console.log(`Logged message with ID: ${messageId}`);
                return messageId;
            } else {
                console.log("Failed to log the message.");
                return null;
            }
        } catch (error) {
            console.log(error);
        }
    },


    async editLog(messageId, newString) {
        try {
            const channelId = my.logs; // Assuming `my.logs` contains the channel ID
            const newContent = { content: newString };

            // Use editMessageInChannel to edit the message across shards
            const success = await editMessageInChannel(channelId, messageId, newContent);

            if (success) {
                console.log(`Log message updated: ${newString}`);
            } else {
                console.log(`Failed to update log message with ID: ${messageId}`);
            }
        } catch (error) {
            console.log(`Error editing log message with ID ${messageId}:`, error);
        }
    },



    async error(message) {
        try {
            const channelId = my.errors_log; // Assuming `my.errors_log` contains the error log channel ID
            const embed = new EmbedBuilder()
                .setTitle("Error")
                .setDescription(message);

            // Use sendTo to send the error embed message to the specified channel
            const messageId = await sendTo({ embeds: [embed] }, channelId);

            if (messageId) {
                console.log(`Error message logged with ID: ${messageId}`);
            } else {
                console.log("Failed to log the error message.");
            }

            console.error(message);
            await this.log(message); // Log the error message to the general log as well
        } catch (error) {
            console.log("Error logging to the errors channel:", error);
        }
    },


    /**
 * @param {Dare} dare 
 */
    async newDare(dare) {

        const channelId = my.dares_log; // Assuming `my.dares_log` contains the dares log channel ID
        const embed = await this.getDareEmbed(dare);
        const actionRow = createActionRow("dare");

        try {
            // Use sendTo to send the dare embed message with action row
            const messageId = await sendTo({ embeds: [embed], components: [actionRow] }, channelId);

            if (messageId) {
                console.log("Logged:", messageId);
                dare.messageId = messageId;
                await dare.save();
            } else {
                console.log("Failed to log the dare message.");
            }
        } catch (error) {
            console.log("Error logging new dare:", error);
        }
    },


    /**
 * @param {Dare} dare 
 */
    async updateDare(dare, userBan = false) {
        const channelId = my.dares_log; // Assuming `my.dares_log` contains the dares log channel ID
        const embed = await this.getDareEmbed(dare);
        const actionRow = createActionRow("dare", dare.isBanned, userBan);

        try {
            if (dare.messageId !== 'pre-v5') {
                // Use editMessageInChannel to edit the message across shards
                const success = await editMessageInChannel(channelId, dare.messageId, { embeds: [embed], components: [actionRow] });

                if (success) {
                    console.log("Updated message with ID:", dare.messageId);
                    return true;
                } else {
                    console.log(`Failed to update dare message with ID: ${dare.messageId}`);
                    return false;
                }
            }
        } catch (error) {
            console.log(`Error updating dare message with ID ${dare.messageId}:`, error);
            return false;
        }
    },


    /**
     * @param {Truth} truth 
     */
    async newTruth(truth) {
        if (truth.server && truth.server.name) serverName = truth.server.name;

        const channelId = my.truths_log; // Assuming `my.truths_log` contains the truths log channel ID
        const embed = await this.getTruthEmbed(truth);
        const actionRow = createActionRow("truth");

        try {
            // Use sendTo to send the truth embed message with action row
            const messageId = await sendTo({ embeds: [embed], components: [actionRow] }, channelId);

            if (messageId) {
                console.log("Logged message with ID:", messageId);
                truth.messageId = messageId;
                await truth.save();
            } else {
                console.log("Failed to log the truth message.");
            }
        } catch (error) {
            console.log("Error logging new truth:", error);
        }
    },

    /**
     * @param {Truth} truth 
     * @param {boolean} [userBan] 
     */
    async updateTruth(truth, userBan = false) {
        let serverName = 'pre-v5';
        if (truth.server && truth.server.name) serverName = truth.server.name;

        const channelId = my.truths_log; // Assuming `my.truths_log` contains the truths log channel ID
        const embed = await this.getTruthEmbed(truth);
        const actionRow = createActionRow("truth", truth.isBanned, userBan);

        try {
            if (truth.messageId !== 'pre-v5') {
                // Use editMessageInChannel to edit the message across shards
                const success = await editMessageInChannel(channelId, truth.messageId, { embeds: [embed], components: [actionRow] });

                if (success) {
                    console.log("Updated message with ID:", truth.messageId);
                    return true;
                } else {
                    console.log(`Failed to update truth message with ID: ${truth.messageId}`);
                    return false;
                }
            }
        } catch (error) {
            console.log(`Error updating truth message with ID ${truth.messageId}:`, error);
            return false;
        }
    },


    /**
 * @param {User} user 
 * @param {number} questions 
 * @param {number} servers 
 */
    async bannedUser(user, questions, servers) {
        const channelId = my.banned_users_log; // Assuming `my.banned_users_log` contains the banned users log channel ID

        const embed = new EmbedBuilder()
            .setTitle("User Banned")
            .addFields(
                { name: "Id", value: user.id ?? ' ' },
                { name: "Username", value: user.username ?? ' ' },
                { name: "Questions:", value: String(questions) ?? ' ' },
                { name: "Servers:", value: String(servers) ?? ' ' },
                { name: "Ban Reason:", value: user.banReason ?? ' ' }
            );

        try {
            // Use sendTo to send the banned user embed message
            const messageId = await sendTo({ embeds: [embed], fetchReply: true }, channelId);

            if (messageId) {
                console.log("Banned user message logged with ID:", messageId);
                user.ban_message_id = messageId;
                await user.save();
            } else {
                console.log("Failed to log the banned user message.");
            }
        } catch (error) {
            console.log("Error logging banned user:", error);
        }
    },


    /**
     * @param {Server} server
     */
    async newServer(server) {
        console.log("New Server");
        const channelId = my.servers_log; // Assuming `my.servers_log` contains the servers log channel ID
        const embed = serverEmbed(server);
        const actionRow = createActionRow("server");

        try {
            // Use sendTo to send the new server embed message with action row
            const messageId = await sendTo({ embeds: [embed], components: [actionRow], fetchReply: true }, channelId);

            if (messageId) {
                console.log("Server message logged with ID:", messageId);
                server.message_id = messageId;
                await server.save();
            } else {
                console.log("Failed to log the server message.");
            }
        } catch (error) {
            console.log("Error logging new server:", error);
        }
    },

    /**
     * @param {Server} server 
     * @param {boolean} [userBan] 
     */
    async updateServer(server, userBan = false) {
        try {
            if (!server._loaded) throw Error("Attempted to update an unloaded server");

            const channelId = my.servers_log;
            const embed = serverEmbed(server);
            const actionRow = createActionRow("server", server.isBanned, userBan);

            // Use editMessageInChannel to edit the server message across shards
            const success = await editMessageInChannel(channelId, server.message_id, { embeds: [embed], components: [actionRow] });

            if (success) {
                console.log("Updated server message with ID:", server.message_id);
                return true;
            } else {
                console.log(`Failed to update server message with ID: ${server.message_id}`);
                return false;
            }
        } catch (error) {
            console.log("Error updating server message:", error);
            return false;
        }
    },

    async deleteServer(messageId) {
        const channelId = my.servers_log;

        try {
            // Use editMessageInChannel to locate and delete the message across shards
            const success = await global.client.shard.broadcastEval(
                async (client, { channelId, messageId }) => {
                    const channel = client.channels.cache.get(channelId);
                    if (channel) {
                        const message = await channel.messages.fetch(messageId).catch(() => null);
                        if (message) {
                            await message.delete();
                            return true;
                        }
                    }
                    return false;
                },
                { context: { channelId, messageId } }
            );

            if (success.some(result => result)) {
                console.log("Server deleted from log.");
            } else {
                console.log("Failed to delete server message.");
            }
        } catch (error) {
            console.log("Error deleting server message:", error);
        }
    },

    /**
     * Logs a new report using the Report class.
     * @param {Report} - The report created by the command. Should be loaded before reaching here
     */
    async newReport(report) {
        try {
            // Create the report embed
            const embed = new EmbedBuilder()
                .setTitle("New Report")
                .addFields(
                    { name: "Type", value: report.type },
                    { name: "Reason", value: report.reason },
                    { name: "Offender", value: `${report.offender.id} | ${report.type == 'server' ? report.offender.name : report.offender.question}` }
                )
                .setTimestamp();

            // Get the channel and send the embed with the action row
            const channelId = my.reports_log;
            await sendTo({
                embeds: [embed],
                components: [this.createReportActionRow()],
            }, channelId);

        } catch (error) {
            console.error(`Failed to log report: ${error}`);
        }
    },

    /**
     * Creates an action row for report actions (e.g., Approve, Dismiss).
     * @returns {ActionRowBuilder} The action row with buttons for report actions.
     */
    createReportActionRow() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("report_safe")
                    .setLabel("Safe")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId("report_ban")
                    .setLabel("Ban")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId("report_show")
                    .setLabel("Show Offender")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),

            );
    },


    getActionRow(type, isBanned = false, userBanned = false) {
        return createActionRow(type, isBanned, userBanned);
    },

    /**
     * 
     * @param {Dare} dare 
     * @returns {Promise<EmbedBuilder>}
     */
    async getDareEmbed(dare) {
        if (!dare.server || !dare.server.name) dare.server = { name: 'Pre-V5' };

        const embed = await questionEmbed(dare);

        return embed;
    },

    /**
     * 
     * @param {Truth} truth 
     * @returns {Promise<EmbedBuilder>}
     */
    async getTruthEmbed(truth) {
        if (!truth.server || !truth.server.name) truth.server = { name: 'Pre-V5' };
        const embed = await questionEmbed(truth);

        return embed
    }

}

/**
 * 
 * @param {Question} question 
 * @returns {Promise<EmbedBuilder>}
 */
async function questionEmbed(question) {
    let embed = new EmbedBuilder()
        .setTitle(`New ${question.type == 'dare' ? 'Dare' : 'Truth'}`)
        .addFields(
            { name: "Question", value: question.question ?? ' ' },
            { name: "Author Name", value: `${await question.getCreatorUsername()} | ${question.creator}` ?? ' ' },
            { name: "Server:", value: question.server.name },
        )
        .setFooter({ text: `ID: #${question.id}` })

    if (question.isApproved) {
        const approvedBy = await question.getApprovedByUser();
        embed.addFields(
            { name: "Approved By:", value: approvedBy.username ?? ' ' },
        )
    }

    if (question.isBanned) {
        const bannedBy = await question.getBannedByUser();
        if (bannedBy) {
            embed.addFields(
                { name: "Banned:", value: "YES" },
                { name: "Ban Reason:", value: question.banReason ?? ' ' },
                { name: "Banned By:", value: bannedBy.username ?? ' ' },
            )
        }
    }

    return embed;
}

/**
 * 
 * @param {Server} server 
 */
function serverEmbed(server) {


    const embedObject = [
        { name: "ID", value: server.id },
        { name: "Name", value: server.name ?? ' ' },
        { name: "AcceptedTerms", value: server.acceptedString() },
        { name: "Banned", value: server.bannedString() },
        { name: "Ban Reason", value: server.banReason ?? ' ' }
    ]
    return new EmbedBuilder()
        .setTitle("New Server")
        .addFields(
            { name: "ID", value: server.id },
            { name: "Name", value: server.name ?? ' ' },
            { name: "AcceptedTerms", value: server.acceptedString() },
            { name: "Banned", value: server.bannedString() },
            { name: "Ban Reason", value: server.banReason ?? ' ' }
        );
}

/**
 * Sends a message to a specific channel across shards.
 * @param {Object} messageOptions - The message options (content, embeds, etc.) to be sent.
 * @param {string} channelId - The ID of the channel to send the message to.
 * @returns {Promise<string|null>} - Resolves with the message ID if sent successfully, or null if unsuccessful.
 */
async function sendTo(messageOptions, channelId) {

    try {
        // Use broadcastEval to locate the correct shard and send the message
        const result = await global.client.shard.broadcastEval(
            async (client, { channelId, messageOptions }) => {
                const channel = client.channels.cache.get(channelId);
                if (channel) {
                    messageOptions.fetchReply = true;
                    const message = await channel.send(messageOptions);
                    return message.id; // Return the message ID
                }
                return false; // Return false if message couldn't be sent
            },
            { context: { channelId, messageOptions } }
        );

        // Find the first non-false result, which will be the message ID
        const messageId = result.find(id => id !== false);
        return messageId || null;
    } catch (error) {
        console.error(`Failed to send message to channel ${channelId}:`, error);
        return null;
    }
}


/**
 * Edits a message in a specific channel across shards.
 * @param {string} channelId - The ID of the channel containing the message.
 * @param {string} messageId - The ID of the message to edit.
 * @param {Object} newContent - The new content for the message (e.g., { content: "Updated message" }).
 * @returns {Promise<boolean>} - Resolves with `true` if the message was edited successfully, `false` otherwise.
 */
async function editMessageInChannel(channelId, messageId, newContent) {
    try {
        // Use broadcastEval to locate the correct shard, fetch the message, and edit it
        const result = await global.client.shard.broadcastEval(
            async (client, { channelId, messageId, newContent }) => {
                const channel = client.channels.cache.get(channelId);
                if (channel) {
                    const message = await channel.messages.cache.get(messageId);
                    if (message) {
                        await message.edit(newContent);
                        return true;
                    }
                }
                return false;
            },
            { context: { channelId, messageId, newContent } }
        );

        // If any shard returned true, the message was successfully edited
        return result.some(success => success);
    } catch (error) {
        console.error(`Failed to edit message in channel ${channelId}:`, error);
        return false;
    }
}


/**
 * 
 * @param {string<truth|dare>} type 
 * @returns {ActionRowBuilder}
 */
function createActionRow(type, isBanned = false, userBanned = false) {
    if (!isBanned) {
        if (type !== 'server') {
            return new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`new_${type}_approve`)
                        .setLabel('Approve')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`new_${type}_ban`)
                        .setLabel('Ban')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`user_${type}_ban`)
                        .setLabel(userBanned ? 'Creator is Banned' : 'Ban Creator')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(userBanned),
                );
        } else {
            return new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`new_${type}_ban`)
                        .setLabel('Ban')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`user_server_ban`)
                        .setLabel(userBanned ? 'Creator is Owner' : 'Ban Owner')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(userBanned),
                );
        }
    } else {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`new_${type}_ban`)
                    .setLabel('Banned')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId(`new_${type}_unban`)
                    .setLabel('Unban')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`user_${type}_ban`)
                    .setLabel(userBanned ? 'Creator is Banned' : 'Ban Creator')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(userBanned),

            );
    }
}