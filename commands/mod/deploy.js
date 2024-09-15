const { SlashCommandBuilder } = require("discord.js");
const { exec } = require("child_process");
const logger = require("objects/logger");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deploy')
        .setDescription('Update the command list on Discord'),

    /**
     * 
     * @param {import("discord.js").Interaction} interaction 
     */
    async execute(interaction) {

        await interaction.deferReply({ ephemeral: true });

        exec('node deploy-commands-global.js && node deploy-commands-mod.js', (error, stdout, stderr) => {
            if (error) {
                logger.error(`Error executing deployCommands.js: ${error.message}`);
                return interaction.editReply('Failed to deploy commands.');
            }
            if (stderr) {
                logger.error(`stderr: ${stderr}`);
                return interaction.editReply('Failed to deploy commands.');
            }
            logger.log(`stdout: ${stdout}`);
            interaction.editReply('Commands deployed successfully.');
        });

    },
};
