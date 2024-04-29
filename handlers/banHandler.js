const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const Database = require("../objects/database");
const { env } = require("process");
const Dare = require("../objects/dare");
const Handler = require("./handler");

class BanHandler{
    constructor() {
        this.banReasonList = [
            { name: "1 - Breaches Discord T&C or Community Guidelines", value: "Breaches Discord T&C or Community Guidelines" },
            { name: "2 - Childish Content", value: "Childish Content" },
            { name: "3 - Dangerous Or Illegal Content", value: "Dangerous Or Illegal Content" },
            { name: "4 - Giver Dare", value: "Giver Dare" },
            { name: "5 - Mentions A Specific Person", value: "Mentions A Specific Person" },
            { name: "6 - Nonsense Content", value: "Nonsense Content" },
            { name: "7 - Not In English", value: "Not In English" },
            { name: "8 - Poor Spelling Or Grammar", value: "Poor Spelling Or Grammar - Feel Free to Resubmit with proper Spelling and Grammer" },
            { name: "9 - Requires More Than One Person", value: "Requires More Than One Person" },
            { name: "10 - Shoutout Content", value: "Shoutout Content" },
            { name: "11 - Suspected U-18 Server", value: "Suspected U-18 Server" }
        ];
    }

    getBanReasons() {
        return this.banReasonList;
    }

    async sendBanNotification(question, reason, type, interaction) {
        const userId = question.creator;
        client = global.client;
        try {
            let embed = this.guidanceEmbed();

            client.users.send(userId, {
                content: `Your ${type} has been banned: \n- **ID**: ${question.id}\n- **Question**: ${question.question}\n- **Reason**: ${reason}\n\nIf you feel this was in error you may appeal the ban by opening a ticket on our [Official Server](https://discord.gg/${env.DISCORD_INVITE_CODE})\n\n`,
                embeds: [embed]
            }).catch(async (error) => {
                if (error.code === 50007) {
                    await interaction.channel.send(`User's Discord Account was not available to DM`);
                } else {
                    console.error('Error:', error);
                }
            });
        } catch (error) {
            interaction.channel.send('Failed to notify User of ban. Check Logs for more information');
            console.log('User Notification Failed: ')
            console.log(error);
        }
    }

    async sendServerBanNotification(guild, reason, interaction) {
        client = interaction.client;
        try {
            const server = client.guilds.cache.get(guild.id);
            const userId = server.ownerId;

            client.users.send(userId, {
                content: `Your Server has been banned: \n- **ID**: ${server.id}\n- **Question**: ${server.name}\n- **Reason**: ${reason}\n\nIf you feel this was in error you may appeal the ban by opening a ticket on our [Official Server](https://discord.gg/${env.DISCORD_INVITE_CODE})\n\n`
            }).catch(async (error) => {
                if (error.code === 50007) {
                    await interaction.channel.send(`User's Discord Account was not available to DM`);
                } else {
                    console.error('Error:', error);
                }
            });
        } catch (error) {
            interaction.channel.send('Failed to notify User of ban. Check Logs for more information');
            console.log('User Notification Failed: ')
            console.log(error);
        }
    }

    async updateActionRow(messageId) {
        console.log('Updating Action Row', messageId);
        if (messageId === 'pre-v5') return false;
        const client = global.client;
        const channel = client.channels.cache.get(env.LOG_DARE_CHANNEL_ID);
        const message = await channel.messages.fetch(messageId);
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('new_dare_ban')
                    .setLabel('Banned')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)
            );
        await message.edit({ components: [actionRow] });
        return true;
    }

    guidanceEmbed() {
        const embed = new EmbedBuilder()
            .setTitle('Avoiding Bans')
            .setDescription('Here are some tips to avoid your truths/dares being banned:')
            .addFields(
                { name: 'No Dangerous Or Illegal Content', value: '- Keep it safe and legal' },
                { name: 'No Targeting Specific People', value: '- Truths/dares are global and should work for everyone' },
                { name: 'No Mentions Of "The Giver"', value: '- Use /give for those types of dares' },
                { name: 'Follow Discord Guidelines', value: '- No Racism, Underage references etc.' },
                { name: 'Use English', value: '- For bot language support' },
                { name: 'No Nonsense Content', value: '- Avoid keyboard smashing, single letters etc' },
                { name: 'No Childish Content', value: '- Could be written by a child/teen, or likely to be ignored' },
                { name: 'No Shoutouts', value: '- Using names, "I am awesome!"' },
                { name: 'No Dares That Require More Than One Person', value: '- This is an **online** bot!' },
                { name: 'Check Spelling And Grammar', value: '- Low-Effort content will not be accepted' },
                { name: '\n', value: '\n' },
                { name: 'Important Note', value: '**You could be banned from using the bot** if we have to repeatedly ban your dares!' }
            );
        return embed;
    }

    truncateString(str, num) {
        if (str.length < num) {
            return str
        }
        return str.slice(0, num - 3) + '...'
    }

    async banDare(id, reason, interaction) {
        const db = new Database();
        try {
            const dare = new Dare(id);
            await dare.load();

            if (!dare.exists) {
                console.log("Attempted to ban a dare that does not exist:", id);
                await interaction.reply('Dare not found!');
                return false;
            }

            this.sendBanNotification(dare, reason, 'dare', interaction);
            dare.isBanned = 1;
            dare.banReason = reason;
            await dare.save();

            let didUpdate = await this.updateActionRow(dare.messageId);
            if (!didUpdate) {
                interaction.reply(`Banned: Failed to update Action Row: Pre-V5 Dare\n\nId: ${dare.id} \n\n Question: ${dare.question}\n\nReason: ${reason}`);
            }
            return true;
        } catch (error) {
            console.error('Error banning dare:', error);
            return false;
        }
    }

    async banTruth(id, reason, interaction) {
        const db = new Database();
        try {
            const truth = await db.get('truths', id);

            if (!truth) {
                await interaction.reply(`Attempted to ban unknown truth with ID: ${id}`);
                return false;
            }

            this.sendBanNotification(truth, reason, 'truth', interaction);
            truth.isBanned = 1;
            truth.banReason = reason;
            await db.set('truths', truth);

            let didUpdate = await this.updateActionRow(truth.messageId);
            if (!didUpdate) {
                interaction.reply(`Banned: Failed to update Action Row for Pre-V5 Truth\n\nID: ${truth.id} \n\nQuestion: ${truth.question}\n\nReason: ${reason}`);
            }

            return true;
        } catch (error) {
            console.error('Error banning truth:', error);
            return false;
        }
    }

    async banServer(id, reason, interaction) {
        const db = new Database();
        try {
            let server = await db.get('servers', id);

            if (!server) {
                await interaction.reply('Server not found!');
                return false;
            }

            this.sendServerBanNotification(server, reason, interaction);

            server.isBanned = 1;
            server.banReason = reason;
            await db.set('servers', server);

            let didUpdate = await this.updateActionRow(server.messageId);
            if (!didUpdate) {
                interaction.reply(`Server has been banned, but failed to update Action Row for Pre-V5 Server\n\nID: ${server.id} \n\nName: ${server.name}\n\nReason: ${reason}`);
            }

            return true;
        } catch (error) {
            console.error('Error banning server:', error);
            return false;
        }
    }

}

module.exports = BanHandler;
