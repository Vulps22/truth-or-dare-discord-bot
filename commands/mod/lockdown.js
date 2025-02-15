const { SlashCommandStringOption, SlashCommandBuilder, SlashCommandSubcommandBuilder } = require("discord.js");
const Database = require("objects/database");

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
     * @param {import("discord.js").ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();
        const db = new Database();

        let maintenance_mode, maintenance_reason;

        if (subCommand === "enable") {
            maintenance_mode = true;
            maintenance_reason = interaction.options.getString('message');
            await interaction.reply(`Lockdown mode enabled with message: ${maintenance_reason}`);
        } else if (subCommand === "disable") {
            maintenance_mode = false;
            maintenance_reason = "";
            await interaction.reply("Lockdown mode disabled.");
        }

        my.maintenance_mode = maintenance_mode;
        my.maintenance_reason = maintenance_reason;

        // Store in database
        await db.set('config', my);

        // Broadcast update to all shards
        await interaction.client.shard.broadcastEval(async (client, {maintenance_mode, maintenance_reason}) => {
            my.maintenance_mode = maintenance_mode;
            my.maintenance_reason = maintenance_reason;
        }, { context: { maintenance_mode, maintenance_reason } });
    },
};
