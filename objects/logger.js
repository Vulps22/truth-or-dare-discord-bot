const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel, Message } = require('discord.js');
const Dare = require('./dare.js');
const Truth = require('./truth.js');
const Server = require('./server.js');
module.exports = {

    async log(message) {
        try{
        let channel = getChannel(my.logs);
        channel.send(message);
        console.log(message);
        } catch(error) {
            console.log(error);
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
        if (dare.server && dare.server.name) serverName = dare.server.name;

        let channel = getChannel(my.dares_log);

        let embed = new EmbedBuilder()
            .setTitle("New Dare")
            .addFields(
                { name: "Dare", value: dare.question ?? '' },
                { name: "Author", value: `${await dare.getCreatorUsername()} | ${dare.creator}` ?? '' },
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
    async updateDare(dare, userBan = false) {
        let serverName = 'pre-v5';
        if (dare.server && dare.server.name) serverName = dare.server.name;

        let channel = getChannel(my.dares_log);

        let embed = new EmbedBuilder()
            .setTitle("New Dare")
            .addFields(
                { name: "Dare", value: dare.question ?? '' },
                { name: "Author Name", value: `${await dare.getCreatorUsername()} | ${dare.creator}` ?? '' },
                { name: "Server:", value: serverName },
                { name: "Ban Reason:", value: dare.banReason ?? '' },
            )
            .setFooter({ text: `ID: #${dare.id}` })
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
        let embed = new EmbedBuilder()
            .setTitle("New Truth")
            .addFields(
                { name: "Truth", value: truth.question ?? '' },
                { name: "Author Name", value: `${await truth.getCreatorUsername()} | ${truth.creator}` ?? '' },
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
     * @param {Truth} truth 
     */
    async updateTruth(truth, userBan = false) {
        let serverName = 'pre-v5';
        if (truth.server && truth.server.name) serverName = truth.server.name;

        let channel = getChannel(my.truths_log);

        let embed = new EmbedBuilder()
            .setTitle("New Truth")
            .addFields(
                { name: "Truth", value: truth.question ?? '' },
                { name: "Author Name", value: `${await truth.getCreatorUsername()} | ${truth.creator}` ?? '' },
                { name: "Server:", value: serverName },
                { name: "Ban Reason:", value: truth.banReason ?? '' },
            )
            .setFooter({ text: `ID: #${truth.id}` })
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
    }
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
    console.log(embedObject);
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
 * @returns 
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