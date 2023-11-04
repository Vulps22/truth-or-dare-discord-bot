const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');
const Database = require('../../database');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Bot Administrators ONLY!')
        .addStringOption(new SlashCommandStringOption()
            .setName("announcement")
            .setDescription("What would you like to say?")
        ),

    async execute(interaction) {

        // Check permissions
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply('You do not have permission to use this command');
        }

        // Check guild ID
        if (interaction.guildId !== process.env.GUILD_ID) {
            return interaction.reply('This command can only be used in the admin guild');
        }

        // Command logic
        const announcement = interaction.options.getString('announcement');

        // Get channels from database
        const guilds = new Database().list("guilds");

        for (let i = 0; i < guilds.length; i++) {

            const channel = guilds[i]['announcement_channel'];

            try {

                await channel.send(announcement);

                await interaction.reply({
                    content: `Announcement sent to ${channel.guild.name}`,
                    ephemeral: true
                });

            } catch (error) {

                console.log(`Error sending to ${channel.id} in ${channel.guild.name}`);

            }

        }
    }

}