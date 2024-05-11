const { SlashCommandStringOption, SlashCommandBuilder, SlashCommandBooleanOption, SlashCommandSubcommandBuilder } = require("discord.js");
const Database = require("../../objects/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Enable or disable the bot with a maintenance message')
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("enable")
            .setDescription("Enable Lockdown Mode")
            .addStringOption(new SlashCommandStringOption()
                .setName('message')
                .setDescription('Maintenance message')
                .setRequired(true)
            )
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("disable")
            .setDescription("Disable Lockdown Mode")

        ),

    /**
     * 
     * @param {import("discord.js").Interaction} interaction 
     */
    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();
        const db = new Database();

        if (subCommand === "enable") {
            const message = interaction.options.getString('message');
            my.maintenance_mode = true;
            my.maintenance_reason = message;
            await interaction.reply(`Lockdown mode enabled with message: ${message}`);
        } else if (subCommand === "disable") {
            my.maintenance_mode = false;
            my.maintenance_reason = "";
            await interaction.reply("Lockdown mode disabled.");
        }
        
        await db.set('config', my);
    },
}
