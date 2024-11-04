const { ChannelType, Interaction } = require("discord.js");
const Advert = require("objects/advert");

class AdvertHandler {
    /**
     * @param {Interaction} interaction 
     */
    constructor(interaction) {
        this.interaction = interaction;
        this.guildId = interaction.guild.id;
        this.officialServer = interaction.client.guilds.cache.get(my.guildId);
        this.advertsChannelId = my.advertChannel;
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
        if (!description) return this.interaction.editReply('You must provide a short description of your server');

        try {
            const invite = await this.interaction.channel.createInvite({ maxAge: 0, maxUses: 0, unique: true });

            const messageContent = `**${this.interaction.guild.name}**\n${description}\nInvite: ${invite.url}\nPosted by ${this.interaction.user.tag}`;
            const messageId = await sendTo({ content: messageContent }, this.advertsChannelId);

            if (messageId) {
                advert.setMessage(messageId);
                advert.setDescription(description);
                await advert.save();
                this.interaction.editReply("Your advert has been successfully posted!");
            } else {
                this.interaction.editReply("There was an issue creating your advert.");
            }
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

        /*if (!advert.canBump()) {
            const nextBumpTime = Math.floor((advert.updated.getTime() + 24 * 60 * 60 * 1000) / 1000);
            return this.interaction.editReply(`You can bump again <t:${nextBumpTime}:R>`);
        }*/

        try {
            await deleteInvites(this.guildId);

            const invite = await this.interaction.channel.createInvite({ maxAge: 0, maxUses: 0, unique: true });

            // Delete the old advert message
            const success = await deleteMessageInChannel(this.advertsChannelId, existingAdvert.messageId);
            if (!success) {
                return this.interaction.editReply("There was an issue deleting the old advert.");
            }

            const messageContent = `**${this.interaction.guild.name}**\n${advert.description}\nInvite: ${invite.url}\nPosted by ${this.interaction.user.tag}`;
            const messageId = await sendTo({ content: messageContent }, this.advertsChannelId);

            if (messageId) {
                advert.setMessage(messageId);
                await advert.save();
                this.interaction.editReply("Your advert has been successfully bumped to the top!");
            } else {
                this.interaction.editReply("There was an issue bumping your advert.");
            }
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

            deleteInvites(guildId);
            // Delete the advert message across shards
            const success = await deleteMessageInChannel(this.advertsChannelId, existingAdvert.messageId);
            if (!success) {
                return this.interaction.editReply("There was an issue deleting your advert message.");
            }

            // Remove the advert from the database
            await advert.delete();
            this.interaction.editReply("Your advert has been successfully canceled and removed.");
        } catch (error) {
            console.error(error);
            this.interaction.editReply("There was an issue canceling your advert. Ensure I have the necessary permissions.");
        }
    }

}


/**
 * Sends a message to a specific channel across shards.
 * @param {Object} messageOptions - The message options (content, embeds, etc.) to be sent.
 * @param {string} channelId - The ID of the channel to send the message to.
 * @returns {Promise<string|null>} - Resolves with the message ID if the message was sent successfully, `null` otherwise.
 */
async function sendTo(messageOptions, channelId) {
    try {
        // Use broadcastEval to locate the correct shard and send the message
        const result = await global.client.shard.broadcastEval(
            async (client, { channelId, messageOptions }) => {
                const channel = client.channels.cache.get(channelId);
                if (channel) {
                    const message = await channel.send(messageOptions);
                    return message.id;
                }
                return null;
            },
            { context: { channelId, messageOptions } }
        );

        // Filter out null results and return the first valid message ID
        const messageId = result.find(id => id !== null);
        return messageId || null;
    } catch (error) {
        console.error(`Failed to send message to channel ${channelId}:`, error);
        return null;
    }
}

async function deleteInvites(guildId) {
    // Broadcast invite deletion across all shards
    await global.client.shard.broadcastEval(async (client, { guildId, botId }) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
            const invites = await guild.invites.fetch();
            for (const invite of invites.values()) {
                if (invite.inviter?.id === botId) {
                    await invite.delete().catch(error => console.error(`Failed to delete invite: ${error}`));
                }
            }
        }
    }, { context: { guildId, botId: global.client.user.id } });
}

async function deleteMessageInChannel(channelId, messageId) {
    try {
        const result = await global.client.shard.broadcastEval(
            async (client, { channelId, messageId }) => {
                const channel = client.channels.cache.get(channelId);
                if (channel) {
                    const message = await channel.messages.fetch(messageId).catch(() => null);
                    if (message) {
                        await message.delete();
                        return true;
                    }
                }
                return false;
            },
            { context: { channelId, messageId } }
        );

        // If any shard successfully deleted the message, return true
        return result.some(success => success);
    } catch (error) {
        console.error(`Failed to delete message with ID ${messageId} in channel ${channelId}:`, error);
        return false;
    }
}


module.exports = AdvertHandler;
