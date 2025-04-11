const Server = require("objects/server");
const Handler = require("handlers/handler");
const embedder = require('embedder.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, ComponentType, Interaction, PermissionFlagsBits, MessageFlags } = require("discord.js");
const logger = require("objects/logger.js");

class SetupHandler extends Handler {
    constructor() {
        super("setup");
    }

    /**
     * 
     * @param {Interaction} interaction 
     */
    async startSetup(interaction) {
        if (!interaction.deferred) await interaction.deferReply();
        let server = new Server(interaction.guildId);
        await server.load();
        if (!server.exists) {  // Assuming there is a property to check if the server is loaded
            await server.save();
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('setup_1_accept')
                    .setLabel('Accept')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('setup_1_decline')
                    .setLabel('Decline')
                    .setStyle(ButtonStyle.Danger)
            );

        await interaction.editReply({ embeds: [embedder.terms()], components: [actionRow] });
    }
    /**
     * 
     * @param {Interaction} interaction 
     */
    async action_1(interaction) {
        let server = new Server(interaction.guildId);
        await server.load();
        let choice = interaction.customId.split('_')[2];

        if (choice === 'accept') {
            server.hasAccepted = 1;
            await server.save();
            logger.updateServer(server);
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('setup_1_accept')
                        .setLabel('Accepted')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true)
                );



            const channelMenu = new ChannelSelectMenuBuilder()
                .setCustomId('setup_2_channel')
                .setPlaceholder('Select a channel')
                .setMinValues(1)
                .setMaxValues(1)
                .setChannelTypes(ChannelType.GuildText);

            const actionRow2 = new ActionRowBuilder()
                .addComponents(channelMenu);

            await interaction.message.edit({ components: [actionRow] });
            const step2 = await interaction.followUp({ content: "Accepted. Please provide the announcement channel.", components: [actionRow2] });

            const collector = step2.createMessageComponentCollector({
                componentType: ComponentType.ChannelSelect,
                filter: i => i.user.id === interaction.user.id,
                time: 60000,
            });

            collector.on('collect', async i => {
                i.handled = true;
                if (i.customId === 'setup_2_channel') {
                    await this.action_2(i);
                    collector.stop();
                }
            });

            // Next steps for channel setup can be initiated here
        } else {
            await interaction.reply("You have declined the terms. I will now leave the server.");
            await interaction.guild.leave();
        }
    }
    /**
 * Triggered when the user chooses a channel to receive announcements in the /setup command
 * @param {Interaction} interaction 
 * @returns 
 */
    async action_2(interaction) {
        interaction.deferReply({ flags: MessageFlags.Ephemeral});
        let channelId = interaction.values[0];

        if (!hasPermission(interaction.guildId, channelId)) {
            interaction.reply('I need permission to view, send messages, embed links, and attach files in that channel');
            return;
        }

        // Fetch the guild and channel
        const guild = global.client.guilds.cache.get(interaction.guildId);
        const targetChannel = guild.channels.cache.get(channelId);

        if (!targetChannel) {
            await interaction.reply("I couldn't find the selected channel. Please try again.");
            return;
        }

        // Check if the bot has MANAGE_WEBHOOKS permission
        if (!targetChannel.permissionsFor(global.client.user).has(PermissionFlagsBits.ManageWebhooks)) {
            await interaction.reply("I need the `MANAGE_WEBHOOKS` permission in this channel to set up announcements properly. Please grant the permission and try again.");
            return;
        }

        // Check if the bot is in the official server and can access the announcement channels
        const officialGuild = global.client.guilds.cache.get(my.guildId);
        if (officialGuild) {
            const announcementChannel = officialGuild.channels.cache.get(my.announcementChannelId);
            const updateChannel = officialGuild.channels.cache.get(my.updateChannelId);

            if (announcementChannel && updateChannel) {
                try {
                    await announcementChannel.addFollower(targetChannel.id, 'Subscribed via /setup');
                    await updateChannel.addFollower(targetChannel.id, 'Subscribed via /setup');

                    await targetChannel.send("✅ This channel has been subscribed to the official announcement and bot update channels.");
                    logger.log(`✅ Subscribed ${guild.name} to announcements and bot updates.`);
                    interaction.editReply("✅ The channel has been subscribed to the official announcement and bot update channels.");
                } catch (error) {
                    logger.error(`Failed to subscribe ${guild.name}:`, error);
                    await interaction.reply("An error occurred while subscribing to announcements. Please try again later.");
                    return;
                }
            } else {
                await interaction.reply("I couldn't access the official announcement channels. Please try again later.");
                return;
            }
        } else {
            // Request another shard to handle the subscription
            const didSubscribe = await askOtherShards(channelId, interaction.guildId);
            if (!didSubscribe) {
                await interaction.reply("I couldn't access the official announcement channels. Please try again later.");
                return;
            } else {
                interaction.editReply("✅ This channel has been subscribed to the official announcement and bot update channels.");
            }
        }
    }


}

/**
 * 
 * @returns {Promise<boolean>} - Returns true if the subscription was successful, false otherwise.
 */
async function askOtherShards( channelId, guildId) {
    return global.client.shard.broadcastEval(async (c, { targetChannelId, serverId }) => {
        const logger = require('objects/logger');
        const officialGuild = c.guilds.cache.get(my.guildId);
        if (officialGuild) {
            const announcementChannel = officialGuild.channels.cache.get(my.announcementChannelId);
            const updateChannel = officialGuild.channels.cache.get(my.updateChannelId);
            if (announcementChannel && updateChannel) {
                try {
                    await announcementChannel.addFollower(targetChannelId, 'Subscribed via /setup');
                    await updateChannel.addFollower(targetChannelId, 'Subscribed via /setup');
                    await c.channels.cache.get(targetChannelId).send("✅ This channel has been subscribed to the official announcement and bot update channels.");
                    logger.log(`✅ Subscribed ${serverId} to announcements and bot updates.`);
                    return true;
                } catch (error) {
                    logger.error(`IPC Subscription Failed for ${serverId}:`, error);
                    return false;
                }
            }
        }
        return false;
    }, { context: { targetChannelId: channelId, serverId: guildId } });
}

function hasPermission(guildId, channelId) {

    //get the channel without using the interaction object
    const guild = global.client.guilds.cache.get(guildId);
    const channel = guild.channels.cache.get(channelId);



    const botPermissions = channel.guild.members.me.permissionsIn(channel);

    if (!botPermissions.has('ViewChannel') || !botPermissions.has('SendMessages') || !botPermissions.has('EmbedLinks')) {
        return false;
    }

    return true;
}

module.exports = SetupHandler;
