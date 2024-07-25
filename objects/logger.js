const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel, Message } = require('discord.js');
const Dare = require('./dare.js');
const Truth = require('./truth.js');
const Server = require('./server.js');
module.exports = {

    async error(message) {
        let channel = getChannel(my.errors_log);
        let embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription(message)
        channel.send({ embeds: [embed] });
        console.error(message);
    },

    /**
     * @param {Dare} dare 
     */
    async newDare(dare) {
        let serverName = 'pre-v5';
        if (dare.server && dare.server.name) serverName = dare.server.name;

        let channel = getChannel(my.dares_log);

        let embed = new EmbedBuilder()
            .setTitle("New Dare")
            .addFields(
                { name: "Dare", value: dare.question ?? '' },
                { name: "Author", value: dare.creator ?? '' },
                { name: "Server:", value: serverName },
                { name: "Ban Reason:", value: dare.banReason ?? '' },

            )
            .setFooter({ text: `ID: #${dare.id}` })
        let actionRow = createActionRow("dare")
        const message = await channel.send({ embeds: [embed], components: [actionRow], fetchReply: true });
        console.log("Logged:", message.id)
        dare.messageId = message.id;
        await dare.save();
    },

    /**
     * @param {Dare} dare 
     */
    async updateDare(dare) {
        let serverName = 'pre-v5';
        if (dare.server && dare.server.name) serverName = dare.server.name;

        let channel = getChannel(my.dares_log);

        let embed = new EmbedBuilder()
            .setTitle("New Dare")
            .addFields(
                { name: "Dare", value: dare.question ?? '' },
                { name: "Author", value: dare.creator ?? '' },
                { name: "Server:", value: serverName },
                { name: "Ban Reason:", value: dare.banReason ?? '' },
            )
            .setFooter({ text: `ID: #${dare.id}` })
        let actionRow = createActionRow("dare", dare.isBanned)

        const message = await channel.messages.edit(dare.messageId, { embeds: [embed], components: [actionRow] })

        console.log("Updated:", message.id)
    },

    /**
     * 
     * @param {Truth} truth 
     */
    async newTruth(truth) {
        let serverName = 'pre-v5';
        if (truth.server && truth.server.name) serverName = truth.server.name;

        let channel = getChannel(my.truths_log);
        let embed = new EmbedBuilder()
            .setTitle("New Truth")
            .addFields(
                { name: "Truth", value: truth.question ?? '' },
                { name: "Author", value: truth.creator ?? '' },
                { name: "Server:", value: serverName },
                { name: "Ban Reason:", value: truth.banReason ?? '' },
            )
            .setFooter({ text: `ID: #${truth.id}` });
        let actionRow = createActionRow("truth");
        const message = await channel.send({ embeds: [embed], components: [actionRow], fetchReply: true });
        console.log("logged", message.id)
        truth.messageId = message.id;
        truth.save();
    },

    /**
     * 
     * @param {Server} server
     */
    async newServer(server) {
        console.log("New Server")
        let channel = getChannel(my.servers_log);
        let embed = serverEmbed(server);
        let actionRow = createServerActionRow();
        const message = await channel.send({ embeds: [embed], components: [actionRow], fetchReply: true });
        console.log("Server Message:", message.id);
        server.message_id = message.id;
        await server.save();
    },

    async updateServer(server) {
        let channel = getChannel(my.servers_log);
        /** @type {Message} */
        let message = await channel.messages.fetch(server.message_id);
        let embed = serverEmbed(server);
        let actionRow = createServerActionRow();
        message.edit({ embeds: [embed], components: [actionRow] });
    }
}
/**
 * 
 * @param {Server} server 
 */
function serverEmbed(server) {


    const embedObject = [
        { name: "Name", value: server.name ?? ' ' },
        { name: "AcceptedTerms", value: server.acceptedString() },
        { name: "Banned", value: server.bannedString() },
        { name: "Ban Reason", value: server.banReason ?? ' ' }
    ]
    console.log(embedObject);
    return new EmbedBuilder()
        .setTitle("New Server")
        .addFields(
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
 * @returns 
 */
function createActionRow(type, isBanned = false) {
    if (!isBanned) {
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
            );
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
            );
    }
}

/**
 * @returns {ActionRowBuilder}
 */
function createServerActionRow() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`new_server_ban`)
                .setLabel('Ban')
                .setStyle(ButtonStyle.Danger),
        );
}