const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandNumberOption, SlashCommandUserOption, Interaction } = require("discord.js");
const Server = require("../../objects/server");
const User = require("../../objects/user");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp')
        .setDescription('Change the bot\'s settings')
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('give')
            .setDescription('give XP to a user')
            .addUserOption(new SlashCommandUserOption()
                .setName('user')
                .setDescription('The user to give XP to')
                .setRequired(true)
            )
            .addNumberOption(new SlashCommandNumberOption()
                .setName('amount')
                .setRequired(true)
                .setDescription('The Amount of XP to give')
            )
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('take')
            .setDescription('Take XP from a user')
            .addUserOption(new SlashCommandUserOption()
                .setName('user')
                .setDescription('The user to take XP from')
                .setRequired(true)
            )
            .addNumberOption(new SlashCommandNumberOption()
                .setName('amount')
                .setRequired(true)
                .setDescription('The Amount of XP to take')
            )

        ),
    administrator: true,
    async execute(interaction) {
        //Log the parameters that have reached this point


        const command = interaction.options.getSubcommand();

        switch (command) {
            case 'give':
                await giveXp(interaction);
                break;
            case 'take':
                await takeXp(interaction);
                break;
            default:
                interaction.reply('Invalid subcommand');
                break;
        }
    },
}
/**
 * 
 * @param {Interaction} interaction 
 */
async function giveXp(interaction) {
    //give XP to a user

    let userId = interaction.options.getUser('user').id;
    let amount = interaction.options.getNumber('amount');
    if (amount < 0) return interaction.reply('You can\'t give negative XP! use /xp take instead');

    let user = new User(userId);
    await user.get();
    await user.loadServerUser(interaction.guildId);

    user.addServerXP(amount);
    await user.saveServerUser();

    interaction.reply(`<@${interaction.user.id}> gave ${amount} XP to <@${userId}>`);
}

/**
 * 
 * @param {Interaction} interaction 
 */
async function takeXp(interaction) {
    //take XP from a user
    let userId = interaction.options.getUser('user').id;
    let amount = interaction.options.getNumber('amount');
    if (amount < 0) return interaction.reply('You can\'t take negative XP! use /xp give instead');

    let user = new User(userId);
    await user.get();
    await user.loadServerUser(interaction.guildId);

    user.subtractServerXP(amount);
    await user.saveServerUser();

    interaction.reply(`<@${interaction.user.id}> took ${amount} XP from <@${userId}>`);
}
