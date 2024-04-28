const Server = require("../objects/server");
const Handler = require("./handler");
const embedder = require('../embedder.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, ComponentType } = require("discord.js");

class SetupHandler extends Handler {
    constructor() {
        super();
    }

    async startSetup(interaction) {
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

        await interaction.reply({ embeds: [embedder.terms()], components: [actionRow] });
    }

    async action_1(interaction) {
        let server = new Server(interaction.guildId);
        await server.load();
        let choice = interaction.customId.split('_')[2];

        if (choice === 'accept') {
            server.hasAccepted = 1;
            await server.save();

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

            await interaction.update({ components: [actionRow] });
            const step2 = await interaction.followUp({ content: "Accepted. Please provide the announcement channel.", components: [actionRow2] });

            const collector = step2.createMessageComponentCollector({
                componentType: ComponentType.ChannelSelect,
                filter: i => i.user.id === interaction.user.id,
                time: 60000,
            });

            collector.on('collect', async i => {
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
     * 
     * @param {Interaction} interaction 
     * @returns 
     */
    async action_2(interaction) {
        let server = new Server(interaction.guildId);
        await server.load();
        let channel = interaction.values[0];
        console.log(channel)
        if (!hasPermission(interaction.guildId, channel)) {
            interaction.reply('I need permission to view, send messages, embed links, and attach files in that channel');
            return;
        }

        server.announcement_channel = channel;
        await server.save();

        await interaction.reply(`Announcement channel set to <#${channel}>`);
        
        interaction.reply('Setup complete');

    }

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
