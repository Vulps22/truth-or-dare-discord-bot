const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel, Message, Snowflake } = require('discord.js');

const Truth = require('objects/truth.js');
const Server = require('objects/server.js');
const Dare = require('./dare');
const Question = require('./question');

module.exports = {

    /**
     * 
     * @param {string} message 
     * @returns {Message}
     */
    async log(message) {
        try {
            let channel = getChannel(my.logs);
            const loggedMessage = await channel.send({ content: message, fetchReply: true });
            console.log(message);
            return loggedMessage
        } catch (error) {
            console.log(error);
        }
    },

    async editLog(messageId, newString) {
        try {
            let channel = getChannel(my.logs); // Fetch the logs channel
            const message = await channel.messages.fetch(messageId); // Fetch the message by its ID

            if (message) {
                await message.edit({ content: newString }); // Edit the message content
                console.log(`Log message updated: ${newString}`);
            } else {
                console.log(`Message with ID ${messageId} not found.`);
            }
        } catch (error) {
            console.log(`Error editing log message with ID ${messageId}:`, error);
        }
    },


    async error(message) {
        let channel = getChannel(my.errors_log);
        let embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription(message)
        channel.send({ embeds: [embed] });
        console.error(message);
        this.log(message);
    },

    /**
     * @param {Dare} dare 
     */
    async newDare(dare) {
        let serverName = 'pre-v5';

        let channel = getChannel(my.dares_log);

        let embed = await this.getDareEmbed(dare);
        let actionRow = createActionRow("dare")
        const message = await channel.send({ embeds: [embed], components: [actionRow], fetchReply: true });
        console.log("Logged:", message.id)
        dare.messageId = message.id;
        await dare.save();
    },

    /**
     * @param {Dare} dare 
     */
    async updateDare(dare, userBan = false) {

        let channel = getChannel(my.dares_log);
        let embed = await this.getDareEmbed(dare);
        let actionRow = createActionRow("dare", dare.isBanned, userBan);

        let message;
        if (dare.messageId !== 'pre-v5') {
            message = await channel.messages.edit(dare.messageId, { embeds: [embed], components: [actionRow] });
            console.log("Updated:", message.id);
        }

        return true;
    },

    /**
     * 
     * @param {Truth} truth 
     */
    async newTruth(truth) {
        let serverName = 'pre-v5';
        if (truth.server && truth.server.name) serverName = truth.server.name;

        let channel = getChannel(my.truths_log);
        let embed = await this.getTruthEmbed(truth);
        let actionRow = createActionRow("truth");

        const message = await channel.send({ embeds: [embed], components: [actionRow], fetchReply: true });
        console.log("logged", message.id)
        truth.messageId = message.id;
        truth.save();
    },

    /**
     * @param {Truth} truth 
     * @param {boolean} [userBan] 
     */
    async updateTruth(truth, userBan = false) {
        let serverName = 'pre-v5';
        if (truth.server && truth.server.name) serverName = truth.server.name;

        let channel = getChannel(my.truths_log);

        let embed = await this.getTruthEmbed(truth);
        let actionRow = createActionRow("truth", truth.isBanned, userBan)

        let message;
        if (truth.messageId !== 'pre-v5') {
            message = await channel.messages.edit(truth.messageId, { embeds: [embed], components: [actionRow] });
            console.log("Updated:", message.id)
        }

        return true;
    },

    /**
     * 
     * @param {User} user 
     * @param {number} questions 
     * @param {number} servers 
     */
    async bannedUser(user, questions, servers) {

        let channel = getChannel(my.banned_users_log);

        let embed = new EmbedBuilder()
            .setTitle("User Banned")
            .addFields(
                { name: "Id", value: user.id ?? ' ' },
                { name: "Username", value: user.username ?? ' ' },
                { name: "Questions:", value: String(questions) ?? ' ' },
                { name: "Servers:", value: String(servers) ?? ' ' },
                { name: "Ban Reason:", value: user.banReason ?? ' ' },

            )
        const message = await channel.send({ embeds: [embed], fetchReply: true });
        user.ban_message_id = message.id;
        await user.save();
    },

    /**
     * 
     * @param {Server} server
     */
    async newServer(server) {
        console.log("New Server")
        let channel = getChannel(my.servers_log);
        let embed = serverEmbed(server);
        let actionRow = createActionRow("server");
        const message = await channel.send({ embeds: [embed], components: [actionRow], fetchReply: true });
        console.log("Server Message:", message.id);
        server.message_id = message.id;
        await server.save();
    },

    /**
     * 
     * @param {Server} server 
     */
    async updateServer(server, userBan = false) {
        try {
            if (!server._loaded) throw Error("Attempted to update an unloaded server");
            let channel = getChannel(my.servers_log);
            /** @type {Message} */
            let message = await channel.messages.fetch(server.message_id);
            let embed = serverEmbed(server);
            let actionRow = createActionRow("server", server.isBanned, userBan);
            message.edit({ embeds: [embed], components: [actionRow] });
            return true;
        } catch {
            return false;
        }
    },

    async deleteServer(messageId) {
        let channel = getChannel(my.servers_log);

        /** @type {Message} */
        let message = await channel.messages.fetch(messageId);
        const didDelete = await message.delete();
        console.log("Server deleted from log?:", didDelete);
    },

    getActionRow(type, isBanned = false, userBanned = false) {
        return createActionRow(type, isBanned, userBanned);
    },

    /**
     * 
     * @param {Snowflake} channelId 
     * @returns 
     */
    async findChannel(channelId) {
        return getChannel(channelId);
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
 * 
 * @param {string} channelId 
 * @returns {TextChannel}
 */
function getChannel(channelId) {
    let client = global.client;
    return client.channels.cache.get(channelId);
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