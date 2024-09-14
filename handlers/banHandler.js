const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Interaction } = require("discord.js");
const Database = require("objects/database");
const { env } = require("process");
const Dare = require("objects/dare");
const Handler = require("handlers/handler");
const Server = require("objects/server");
const logger = require("objects/logger");
const Truth = require("objects/truth");
const User = require("objects/user");
const Question = require("objects/question");
const embedder = require("embedder");

class BanHandler {
    constructor() {
        this.banReasonList = [
            { name: "1 - Dangerous or Illegal Content", value: "Dangerous Or Illegal Content" },
            { name: "2 - Breaches Discord T&C or Community Guidelines", value: "Breaches Discord T&C or Community Guidelines" },
            { name: "3 - Not In English", value: "Not In English" },
            { name: "4 - Mentions A Specific Person", value: "Mentions A Specific Person" },
            { name: "5 - Incorrect Category Of Question", value: "Incorrect Category Of Question" },
            { name: "6 - Giver Dare", value: "Giver Dare" },
            { name: "7 - Childish Content", value: "Childish Content" },
            { name: "8 - Nonsense Content", value: "Nonsense Content" },
            { name: "9 - Not A Question", value: "Not A Question" },
            { name: "10 - Likely to be Ignored", value: "Likely To Be Ignored" },
            { name: "11 - Requires More Than One Person", value: "Requires More Than One Person" },
            { name: "12 - Low effort", value: "Low effort" },
            { name: "13 - Poor Spelling or Grammar", value: "Poor Spelling Or Grammar - Feel Free to Resubmit with proper Spelling and Grammer" }
        ];


        this.serverBanReasonList = [
            { name: "1 - Breaches Discord T&C or Community Guidelines", value: "Breaches Discord T&C or Community Guidelines" },
            { name: "2 - Server Name suggests members could be under 18", value: "Server Name suggests members could be under 18" },
            { name: "3 - Server Activity suggests members could be under 18", value: "Server Activity suggests members could be under 18" },
            { name: "3 - Server Name contains Hate Speech", value: "Server Name contains Hate Speech" },
            { name: "4 - Confirmed server members are under 18", value: "Confirmed members are under 18" },
            { name: "5 - Server-wide creation spam", value: "Server-wide creation spam" },
        ];

        this.UserBanReasonList = [
            { name: "1 - Breached Discord T&C or Community Guidelines", value: "Breaches Discord T&C or Community Guidelines" },
            { name: "2 - Suspected Under 18 User", value: "Suspected Under 18 User" },
            { name: "3 - Activity suggests user could be under 18", value: "Activity suggests user could be under 18" },
            { name: "3 - Name contains Hate Speech", value: "Name contains Hate Speech" },
            { name: "4 - Confirmed user is under 18", value: "Confirmed user is under 18" },
            { name: "5 - creation spam", value: "creation spam" },
        ]
    }

    getBanReasons() {
        return this.banReasonList;
    }

    getServerBanReasons() {
        return this.serverBanReasonList;
    }

    getUserBanReasons() {
        return this.UserBanReasonList;
    }

    async sendBanNotification(question, reason, type, interaction) {
        const userId = question.creator;

        client = global.client;
        try {
            let embed = embedder.rules();

            client.users.send(userId, {
                content: `Your ${type} has been banned: \n- **ID**: ${question.id}\n- **Question**: ${question.question}\n- **Reason**: ${reason}\n\nIf you feel this was in error you may appeal the ban by opening a ticket on our [Official Server](https://discord.gg/${env.DISCORD_INVITE_CODE})\n\n`,
                embeds: [embed]
            }).catch(async (error) => {
                if (error.code === 50007) {
                    await interaction.channel.send(`User's Discord Account was not available to DM`);
                } else {
                    logger.error('Error:', JSON.stringify(error));
                }
            });
        } catch (error) {
            console.log("Failed to notify user of ban:", error)
            interaction.channel.send('Failed to notify User of ban. Check Logs for more information');
            logger.log('User Notification Failed: ')
            logger.log(JSON.stringify(error));
        }
    }
    /**
     * 
     * @param {User} user 
     * @param {String} reason 
     * @param {Interaction} interaction 
     */
    async sendUserBanNotification(user, reason, interaction) {
        const userId = user.id
        client = global.client;
        try {
            let embed = embedder.rules();

            client.users.send(userId, {
                content: `You have been banned from using Truth Or Dare Online 18+\n- **Reason**: ${reason}\n- All your Truths and Dares have also been automatically banned as a precaution\n- Any servers you own that are currently using the bot have also been banned\n- Any servers you add in the future will automatically be banned as a precaution\n\nIf you feel this was in error you may appeal the ban by opening a ticket on our [Official Server](https://discord.gg/${env.DISCORD_INVITE_CODE})\n\n`,
                embeds: [embed]
            }).catch(async (error) => {
                if (error.code === 50007) {
                    await interaction.channel.send(`User's Discord Account was not available to DM`);
                } else {
                    logger.error('Error:', JSON.stringify(error));
                }
            });
        } catch (error) {
            interaction.channel.send('Failed to notify User of ban. Check Logs for more information');
            logger.error('User Notification Failed: ' + error.message);
        }
    }

    async sendServerBanNotification(guild, reason, interaction) {
        client = global.client;
        try {
            const server = client.guilds.cache.get(guild.id);
            const userId = server.ownerId;

            client.users.send(userId, {
                content: `Your Server has been banned: \n- **ID**: ${server.id}\n- **Question**: ${server.name}\n- **Reason**: ${reason}\n\nIf you feel this was in error you may appeal the ban by opening a ticket on our [Official Server](https://discord.gg/${env.DISCORD_INVITE_CODE})\n\n`
            }).catch(async (error) => {
                if (error.code === 50007) {
                    await interaction.channel.send(`User's Discord Account was not available to DM`);
                } else {
                    logger.error('Error:', JSON.stringify(error));
                }
            });
        } catch (error) {
            interaction.channel.send('Failed to notify User of ban. Check Logs for more information');
            logger.log('User Notification Failed: ')
            logger.log(JSON.stringify(error));
        }
    }

    async updateActionRow(messageId, logChannel, type) {
        if (!type) throw Error("Type Undefined when updating action row");

        logger.log('Updating Action Row', messageId);
        if (messageId === 'pre-v5') return false;
        const client = global.client;
        const channel = client.channels.cache.get(logChannel);
        const message = await channel.messages.fetch(messageId);
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ban_${type}`)
                    .setLabel('Banned')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId(`unban_${type}`)
                    .setLabel('Unban')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(false)
            );
        await message.edit({ components: [actionRow] });
        return true;
    }

    truncateString(str, num) {
        if (str.length < num) {
            return str
        }
        return str.slice(0, num - 3) + '...'
    }
    /**
     * @deprecated Use banQuestion Instead
     */
    banDare() {
        throw new Error("Use BanQuestion instead");
    }

    /**
    * @deprecated Use banQuestion Instead
    */
    banTruth() {
        throw new Error("Use BanQuestion instead");
    }

    async banQuestion(id, reason, interaction, notify = true, userBan = false) {
        try {
            const question = new Question(id);
            await question.load();

            if (!question.exists) {
                logger.log("Attempted to ban a Question that does not exist:", id);
                if (notify) await interaction.followUp('Question not found!');
                return false;
            }
            if (notify) this.sendBanNotification(question, reason, question.type, interaction);
            question.isBanned = 1;
            question.banReason = reason;
            await question.save();

            let didUpdate = null;
            if (question.type == 'dare') {
                didUpdate = await logger.updateDare(question, userBan);
            } else {
                didUpdate = await logger.updateTruth(question, userBan);
            }
            if (!didUpdate) {
                if (notify) interaction.followUp(`Banned: Failed to update Action Row: Pre-V5 Question\n\nId: ${question.id} \n\n Question: ${question.question}\n\nReason: ${reason}`);
            }

            if(notify) interaction.followUp({content: "Question has been banned!", ephemeral: true});

            return true;
        } catch (error) {
            logger.error(`Error banning question`);
            return false;
        }
    }

    /**
     * 
     * @param {string} id 
     * @param {string} reason 
     * @param {Interaction} interaction 
     * @returns 
     */
    async banServer(id, reason, interaction, notify = true, silent = false, userBan = false) {
        try {
            let server = new Server(id);
            await server.load();

            if (!server._loaded) {
                if (!silent) await interaction.followUp('Server not found! It probably removed the bot.');
                return false;
            }

            if (notify) this.sendServerBanNotification(server, reason, interaction);

            server.isBanned = 1;
            server.banReason = reason;
            // server.save();

            //let didUpdate = await this.updateActionRow(server.message_id, my.servers_log, "server");
            const didUpdate = await logger.updateServer(server, userBan);
            if (!didUpdate) {
                if (!silent) interaction.followUp({ content: `Server has been banned, but failed to update Action Row for Pre-V5 Server\n\nID: ${server.id} \n\nName: ${server.name}\n\nReason: ${reason}`, ephemeral: false });
            }

            interaction.followUp("Server has been banned!");

            return true;
        } catch (error) {
            logger.error('Error banning server:', JSON.stringify(error));
            return false;
        }
    }

    /**
  * 
  * @param {string} id 
  * @param {string} reason 
  * @param {Interaction} interaction 
  * @returns 
  */
    async banUser(id, reason, interaction) {

        logger.log("Banning User " + id);
        try {
            let user = new User(id);
            await user.get();

            if (!user._loaded) {
                await interaction.editReply('User not found! It probably removed the bot.');
                return false;
            }

            user.isBanned = 1;
            user.banReason = reason;
            await user.save();

            // ban every dare the user created
            const db = new Database();

            /** @type {number} */
            let questions = 0;
            let servers = 0;

            // Collect all the promises
            const questionPromises = db.query(`SELECT id FROM questions WHERE creator=${user.id} AND isBanned=0`).then((_questions) => {
                return Promise.all(_questions.map(async (_question) => {
                    await this.banQuestion(_question.id, "Creator was Banned", interaction, false, true);
                    questions++;
                }));
            });

            const serverPromises = db.query(`SELECT * FROM servers WHERE owner=${user.id} AND isBanned=0`).then((_servers) => {
                return Promise.all(_servers.map(async (_server) => {
                    await this.banServer(_server.id, "Owner was Banned", interaction, false, true, true);
                    servers++;
                }));
            });

            // Wait for all promises to resolve
            await Promise.all([questionPromises, serverPromises]);

            logger.log(`User: ${user.username} with ID: ${user.id} has been banned for ${user.banReason} | Auto-Banned: ${questions} Truths/Dares | ${servers} Servers`);
            logger.bannedUser(user, questions, servers);
            interaction.followUp("User has been banned. Check #logs for details");

            await this.sendUserBanNotification(user, reason, interaction);

            return true;
        } catch (error) {
            logger.error('Error banning user:', JSON.stringify(error));
            return false;
        }
    }


}

module.exports = BanHandler;
