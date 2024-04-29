const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } = require('discord.js');
const Dare = require('./dare.js');
module.exports = {
    /**
     * 
     * @param {Dare} dare 
     */
    async newDare(dare) {
        let channel = getChannel(process.env.LOG_DARE_CHANNEL_ID);
        let embed = new EmbedBuilder()
            .setTitle("New Dare")
            .addFields(
                { name: "Dare", value: dare.question },
                { name: "Author", value: dare.creator },
                { name: "Server:", value: dare.server.name }
            )
        let actionRow = createActionRow("dare")
        const message = await channel.send({ embeds: [embed], components: [actionRow] });
        console.log(message.id)
        dare.messageId = message.id;
        dare.save();
    },

    /**
     * 
     * @param {Truth} truth 
     */
    async newTruth(truth) {
        let channel = getChannel(process.env.LOG_TRUTH_CHANNEL_ID);
        let embed = new EmbedBuilder()
            .setTitle("New Truth")
            .addFields(
                { name: "Truth", value: truth.question },
                { name: "Author", value: truth.creator },
                { name: "Server:", value: truth.server.name }
            )
        let actionRow = createActionRow("truth");
        const message = await channel.send({ embeds: [embed], components: [actionRow] });
        console.log(message.id)
        truth.messageId = message.id;
        truth.save();
    }


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
function createActionRow(type) {
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
}