const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandNumberOption, SlashCommandStringOption, SlashCommandChannelOption, TextChannel } = require("discord.js");
const Server = require("../../objects/server");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set')
        .setDescription('Change the bot\'s settings')
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('channel')
            .setDescription('Choose which channels notifications are sent to')
            .addStringOption(new SlashCommandStringOption()
                .setName('event')
                .setRequired(true)
                .setDescription('The notification you want to set')
                .addChoices(
                    { name: "Updates and announcements", value: 'announcements' },
                    { name: "User Level Up", value: 'levelup' },
                )
            )
            .addChannelOption(new SlashCommandChannelOption()
                .setName('channel')
                .setRequired(true)
                .setDescription("The channel where you want this notification")
            )
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('xp')
            .setDescription('Set the amount of XP users can gain or lose')
            .addStringOption(new SlashCommandStringOption()
                .setName('type')
                .setRequired(true)
                .setDescription('The type of XP offered')
                .addChoices(
                    { name: "Dare Complete", value: 'dare_success' },
                    { name: "Dare Failed", value: 'dare_fail' },
                    { name: "Truth Complete", value: 'truth_success' },
                    { name: "Truth Failed", value: 'truth_fail' },
                )
            )
            .addNumberOption(new SlashCommandNumberOption()
                .setName('amount')
                .setRequired(true)
                .setDescription('The amount of xp gained or lost')
                .setMinValue(0)
            )
        ),
    administrator: true,
    async execute(interaction) {
        //Log the parameters that have reached this point

        
        const command = interaction.options.getSubcommand();

        switch (command) {
            case 'channel':
                await setChannel(interaction);
                break;
            case 'xp':
                await setXP(interaction);
                break;
            default:
                interaction.reply('Invalid subcommand');
                break;
        }
    },
}

async function setChannel(interaction) {
    const event = interaction.options.getString('event');
    /** @type {TextChannel} */
    const channel = interaction.options.getChannel('channel');

    //Log the parameters that have reached this point
    switch( event ) {
        case 'announcements':
            console.log(`Setting announcements to ${channel}`);
            break;
        case 'levelup':
        setLevelUpChannel(channel, interaction);
            break;
        default:
            console.log(`Invalid event ${event}`);
            break;
    }
    //interaction.reply(`Setting ${event} notifications to ${channel}`);
}

/**
 * 
 * @param {TextChannel} channel 
 */
async function setLevelUpChannel(channel, interaction) {

    if(!hasPermission(channel)) {
        interaction.reply('I need permission to view, send messages, and attach files in that channel');
        return;
    }

    const server = new Server(channel.guildId);
    await server.load();
    server.level_up_channel = channel.id;
    await server.save();

    channel.send('Level up notifications will be sent here');
}

function hasPermission(channel) {

    const botPermissions = channel.guild.members.me.permissionsIn(channel);

    if (!botPermissions.has('ViewChannel') || !botPermissions.has('SendMessages') || !botPermissions.has('AttachFiles')) {
        return false;
    }

    return true;
}