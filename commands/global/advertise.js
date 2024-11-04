const { SlashCommandBuilder, ChannelType, Interaction, PermissionsBitField, PermissionFlagsBits } = require("discord.js");
const AdvertHandler = require("handlers/advertHandler");
const Advert = require("objects/advert");
const logger = require("objects/logger");


module.exports = {
    data: new SlashCommandBuilder()
        .setName('advertise')
        .setDescription('Post an invite to your server on the Truth Or Dare 18+ Official Server')
        .addSubcommand(command =>
            command.setName('send')
                .setDescription('Send a new Advert to the Official Server')
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Briefly describe your server')
                        .setRequired(true)
                )
        )
        .addSubcommand(command =>
            command.setName('cancel')
                .setDescription('Cancel your existing Advert')
        )
        .addSubcommand(command =>
            command.setName('bump')
                .setDescription('Bump your Advert to the top')
        ),
    nsfw: false,
    administrator: false,

    /**
     * Executes the appropriate subcommand
     * @param {Interaction} interaction 
     * @returns 
     */
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // Check if the user is the server owner
        if (interaction.guild.ownerId !== interaction.user.id) {
            return interaction.editReply("Only the server owner can use this command.");
        }

        if (!await this.hasPermission(interaction)) {
            return;
        }

        const advertHandler = new AdvertHandler(interaction);

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'send') {
            await advertHandler.send();
        } else if (subcommand === 'bump') {
            await advertHandler.bump();
        } else if (subcommand === 'cancel') {
            await advertHandler.cancel();
        }
    },

    /**
     * @param {Interaction} interaction 
     * @returns 
     */
    async hasPermission(interaction) {

        const botPermissions = interaction.guild.members.me.permissionsIn(interaction.channel);

        if (!botPermissions.has(PermissionFlagsBits.CreateInstantInvite)) {
            interaction.editReply('I do not have permission to create invites. I require permission to `Create Invite` to submit an advert');
            logger.log("Interaction cancelled: Could not create invites");
            return false;
        }

        if (!botPermissions.has(PermissionFlagsBits.ManageGuild)) {
            interaction.editReply('I do not have permission to delete old invites. I require permission to `Manage Server` to safely bump or cancel adverts');
            logger.log("Interaction cancelled: Could not manage server");
            return false;
        }


        
        return true;
    }
};
