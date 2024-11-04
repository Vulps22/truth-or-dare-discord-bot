const { ChannelType, Interaction } = require("discord.js");
const Advert = require("objects/advert");

class AdvertHandler {

    /**
     * 
     * @param {Interaction} interaction 
     */
    constructor(interaction) {
        this.interaction = interaction;
        this.guildId = interaction.guild.id;
        this.officialServer = interaction.client.guilds.cache.get(my.guildId);
        this.advertsChannel = this.officialServer?.channels.cache.get(my.advertChannel);
    }

    /**
     * Sends a new advert and saves it in the database.
     */
    async send() {
        const advert = new Advert(this.guildId);
        const existingAdvert = await advert.get();

        if (existingAdvert) {
            return this.interaction.editReply("An advert already exists for your server. Use `/advertise bump` to refresh it or `/advertise cancel` to delete it.");
        }

        const description = this.interaction.options.getString('description');
        if(!description) return this.interaction.editReply('You must provide a short description of your server');

        try {
            const invite = await this.interaction.channel.createInvite({ maxAge: 0, maxUses: 0, unique: true });

            if (!this.advertsChannel || this.advertsChannel.type !== ChannelType.GuildText) {
                return this.interaction.editReply("Could not find the adverts channel in the official server.");
            }

            const messageContent = `**${this.interaction.guild.name}**\n${description}\nInvite: ${invite.url}\nPosted by ${this.interaction.user.tag}`;
            const message = await this.advertsChannel.send(messageContent);

            advert.setMessage(message.id);
            advert.setDescription(description);
            await advert.save();

            this.interaction.editReply("Your advert has been successfully posted!");
        } catch (error) {
            console.error(error);
            this.interaction.editReply("There was an issue creating your advert. Ensure I have the necessary permissions.");
        }
    }

    /**
     * Bumps an existing advert by deleting the old message and creating a new one.
     */
    async bump() {
        const advert = new Advert(this.guildId);
        const existingAdvert = await advert.get();

        if (!existingAdvert) {
            return this.interaction.editReply("No existing advert found. Use `/advertise send` to create a new advert.");
        }

        if (!advert.canBump()) {
            // Get the updated timestamp and add 24 hours (in milliseconds) to get the next bump time
            const nextBumpTime = new Date(advert.updated.getTime() + 24 * 60 * 60 * 1000);
        
            // Convert to a Discord timestamp format
            const nextBumpTimestamp = Math.floor(nextBumpTime.getTime() / 1000);
            
            return this.interaction.editReply(`You can bump again <t:${nextBumpTimestamp}:R>`);
        }

        try {
            const invites = await this.interaction.guild.invites.fetch();
            invites.forEach(async invite => {
                if (invite.channelId === this.interaction.channel.id && invite.inviterId === this.interaction.client.user.id) {
                    await invite.delete();
                }
            });

            const invite = await this.interaction.channel.createInvite({ maxAge: 0, maxUses: 0, unique: true });

            if (!this.advertsChannel || this.advertsChannel.type !== ChannelType.GuildText) {
                return this.interaction.editReply("Could not find the adverts channel in the official server.");
            }

            const oldMessage = await this.advertsChannel.messages.fetch(existingAdvert.messageId);
            await oldMessage.delete();

            const messageContent = `**${this.interaction.guild.name}**\n${advert.description}\nInvite: ${invite.url}\nPosted by ${this.interaction.user.tag}`;
            const newMessage = await this.advertsChannel.send(messageContent);

            advert.setMessage(newMessage.id);
            await advert.save();

            this.interaction.editReply("Your advert has been successfully bumped to the top!");
        } catch (error) {
            console.error(error);
            this.interaction.editReply("There was an issue bumping your advert. Ensure I have the necessary permissions.");
        }
    }

    /**
     * Cancels an existing advert by deleting the message and removing it from the database.
     */
    async cancel(guildId = this.guildId) {
        const advert = new Advert(guildId);
        const existingAdvert = await advert.get();

        if (!existingAdvert) {
            return this.interaction.editReply("No existing advert found to cancel.");
        }

        try {
            if (!this.advertsChannel || this.advertsChannel.type !== ChannelType.GuildText) {
                return this.interaction.editReply("Could not find the adverts channel in the official server.");
            }

            const message = await this.advertsChannel.messages.fetch(existingAdvert.messageId);
            await message.delete();

            await advert.delete();
            this.interaction.editReply("Your advert has been successfully canceled and removed.");
        } catch (error) {
            console.error(error);
            this.interaction.editReply("There was an issue canceling your advert. Ensure I have the necessary permissions.");
        }
    }
}

module.exports = AdvertHandler;
