const { SlashCommandStringOption, SlashCommandBuilder, SlashCommandBooleanOption, SlashCommandSubcommandBuilder } = require("discord.js");
const Database = require("../../objects/database");
const Truth = require("../../objects/truth");
const Dare = require("../../objects/dare"); // Assuming you have a Dare class similar to Truth
const logger = require("../../objects/logger");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('init')
        .setDescription('Initialise this channel as a log channel')
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("truths")
            .setDescription("Set this channel as the log channel for new Truths")
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("dares")
            .setDescription("Set this channel as the log channel for new Dares")
        ),

    /**
     * 
     * @param {import("discord.js").Interaction} interaction 
     */
    async execute(interaction) {
        interaction.reply("Channel Set: Initialising...");
        const subCommand = interaction.options.getSubcommand();
        const db = new Database();

        const channelId = interaction.channelId;
        // Function to create a delay
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));


        if (subCommand === "truths") {
            global.config.truths_log = channelId;
            await db.set('config', global.config);
            const truths = await db.list('truths');
            
            for (let i = 0; i < truths.length; i++) {
                const element = truths[i];
                const truth = new Truth(element.id);
                await truth.load();
                logger.newTruth(truth);

                // Wait for 0.5 second before the next iteration
                await delay(1000);
            }
        } else if (subCommand === "dares") {
            global.config.dares_log = channelId; // Assuming you want to set a log channel for dares
            await db.set('config', global.config);
            const dares = await db.list('dares'); // Assuming you have a 'dares' collection in your database

            for (let i = 0; i < dares.length; i++) {
                const element = dares[i];
                const dare = new Dare(element.id); // Assuming Dare is a class similar to Truth
                await dare.load();
                logger.newDare(dare); // Assuming you have a method to log dares

                // Wait for 0.5 second before the next iteration
                await delay(1000);
            }
        }
        
    },
}