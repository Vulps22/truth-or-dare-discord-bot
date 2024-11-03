const { SlashCommandBuilder, ChannelType, Interaction } = require("discord.js");
const Advert = require("objects/advert");


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

        if (!this.hasPermission(interaction)) {
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'send') {
            await this.handleSend(interaction);
        } else if (subcommand === 'bump') {
            await this.handleBump(interaction);
        } else if (subcommand === 'cancel') {
            await this.handleCancel(interaction);
        }
    },

    /**
     * Handles the 'send' subcommand
     * @param {Interaction} interaction 
     */
    async handleSend(interaction) {
        const description = interaction.options.getString('description');
        const advert = new Advert(interaction.guild.id);
        const existingAdvert = await advert.get();

        // Prevent sending a new advert if one already exists
        if (existingAdvert) {
            return interaction.editReply("An advert already exists for your server. Use `/advertise bump` to refresh it or `/advertise cancel` to delete it.");
        }

        if (description == null) {
            return interaction.editReply("You must provide a description");
        }

        try {
            const invite = await interaction.channel.createInvite({ maxAge: 0, maxUses: 0, unique: true });

            const officialServer = interaction.client.guilds.cache.get(my.guildId);
            const advertsChannel = officialServer.channels.cache.get(my.advertChannel);

            if (!advertsChannel || advertsChannel.type !== ChannelType.GuildText) {
                return interaction.editReply("Could not find the adverts channel in the official server.");
            }

            const messageContent = `**${interaction.guild.name}**\n${description}\nInvite: ${invite.url}\nPosted by ${interaction.user.tag}`;
            const message = await advertsChannel.send(messageContent);
            console.log(message.id);
            // Save the message ID in the database
            advert.setMessage(message.id);
            advert.setDescription(description);
            await advert.save();

            interaction.editReply("Your advert has been successfully posted!");
        } catch (error) {
            console.error(error);
            interaction.editReply("There was an issue creating your advert. Ensure I have the necessary permissions.");
        }
    },

    /**
 * Handles the 'bump' subcommand
 * @param {Interaction} interaction 
 */
    async handleBump(interaction) {
        const advert = new Advert(interaction.guild.id);
        const existingAdvert = await advert.get();

        if (!existingAdvert) {
            return interaction.editReply("No existing advert found. Use `/advertise send` to create a new advert.");
        }

        try {
            // Fetch and delete only invites created by the bot in the channel
            const invites = await interaction.guild.invites.fetch();
            invites.forEach(async invite => {
                if (invite.channelId === interaction.channel.id && invite.inviterId === interaction.client.user.id) {
                    await invite.delete();
                }
            });

            // Create a new invite for the channel
            const invite = await interaction.channel.createInvite({ maxAge: 0, maxUses: 0, unique: true });

            const officialServer = interaction.client.guilds.cache.get(my.guildId);
            const advertsChannel = officialServer.channels.cache.get(my.advertChannel);

            if (!advertsChannel || advertsChannel.type !== ChannelType.GuildText) {
                return interaction.editReply("Could not find the adverts channel in the official server.");
            }

            // Delete the old advert message
            const oldMessage = await advertsChannel.messages.fetch(existingAdvert.messageId);
            await oldMessage.delete();

            // Send a new advert message
            const messageContent = `**${interaction.guild.name}**\n${advert.description}\nInvite: ${invite.url}\nPosted by ${interaction.user.tag}`;
            const newMessage = await advertsChannel.send(messageContent);

            // Update the advert with the new message ID
            advert.setMessage(newMessage.id);
            await advert.save();

            interaction.editReply("Your advert has been successfully bumped to the top!");
        } catch (error) {
            console.error(error);
            interaction.editReply("There was an issue bumping your advert. Ensure I have the Manage Server permission so I can delete the old invite.");
        }
    },

    /**
     * Handles the 'cancel' subcommand
     * @param {Interaction} interaction 
     */
    async handleCancel(interaction) {
        const advert = new Advert(interaction.guild.id);
        const existingAdvert = await advert.get();

        if (!existingAdvert) {
            return interaction.editReply("No existing advert found to cancel.");
        }

        try {
            const officialServer = interaction.client.guilds.cache.get(my.guildId);
            const advertsChannel = officialServer.channels.cache.get(my.advertChannel);

            if (!advertsChannel || advertsChannel.type !== ChannelType.GuildText) {
                return interaction.editReply("Could not find the adverts channel in the official server.");
            }

            // Delete the advert message
            const message = await advertsChannel.messages.fetch(existingAdvert.messageId);
            await message.delete();

            // Remove the advert from the database
            await advert.delete();

            interaction.editReply("Your advert has been successfully canceled and removed.");
        } catch (error) {
            console.error(error);
            interaction.editReply("There was an issue canceling your advert. Ensure I have the necessary permissions.");
        }
    },
    /**
     * @param {Interaction} interaction 
     * @returns 
     */
    async hasPermission(interaction) {

        const botPermissions = interaction.guild.members.me.permissionsIn(interaction.channel);

        if (!botPermissions.has('CreateInvite')) {
            interaction.editReply('I do not have permission to create invites. I require permission to `Create Invite` to submit an advert');
            logger.log("Interaction cancelled: Could not create invites");
            return false;
        }

        if (!botPermissions.has('ManageServer')) {
            interaction.editReply('I do not have permission to delete old invites. I require permission to `Manage Server` to safely bump or cancel adverts');
            logger.log("Interaction cancelled: Could not manage server");
            return false;
        }


        
        return true;
    }
};
