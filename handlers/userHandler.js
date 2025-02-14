require('dotenv').config();
const { EmbedBuilder, Embed } = require('discord.js');
const User = require('objects/user.js');
const Handler = require('handlers/handler.js');
const Question = require('objects/question.js');
const Database = require('objects/database');
const embedder = require('embedder.js');
const Server = require('objects/server.js'); // Import the Server class
const logger = require('objects/logger.js');
const { userFromObject } = require('objects/loader');


class UserHandler extends Handler {
    db;

    constructor() {
        super();
        this.db = new Database();
        this.type = 'user';
    }

    async startSetup(interaction) {
        const embed = this.getTerms();
        const server = await this.findServer(interaction.guildId);
        if (!server) {
            await this.db.set('servers', { id: interaction.guildId, name: interaction.guild.name, hasAccepted: 0, isBanned: 0 });
            interaction.reply({ embeds: [embed] });
        } else {
            if (!server.hasAccepted) interaction.reply({ embeds: [embed] });
            else interaction.reply('You have already accepted my terms');
        }
    }

    async acceptSetup(interaction) {
        const server = await this.findServer(interaction.guildId);
        if (!server) {
            interaction.reply("You must first use /setup and read the Terms of Use");
            return;
        }

        if (server.hasAccepted) {
            interaction.reply('You have already accepted my terms');
            return;
        }

        server.hasAccepted = 1;
        await server.save(); // Save the updated server instance
        interaction.reply({ embeds: [embedder.accepted()] });
    }

    getTerms() {
        return embedder.terms();
    }

    async getUser(id, username = undefined) {
        return await new User(id, username).get();
    }

    async findServer(guildId) {
        const server = new Server(guildId);
        await server.load();
        return server;
    }

    async banUser(interaction, user) {
        this.getBanReason(interaction, user.id);
    }

    async cleanUp() {
        const today = new Date().toISOString().split('T')[0]; // Format today's date as YYYY-MM-DD

        // Query to find users with deleteDate <= today
        const usersToDelete = await this.db.query(`
            SELECT * 
            FROM users 
            WHERE deleteDate IS NOT NULL AND deleteDate <= '${today}'
        `);

        // If no users to delete, log and exit
        if (usersToDelete.length === 0) {
            console.log('No users to delete.');
            return;
        }

        let deletedUsers = 0;
        // Loop through and delete each user
        for (const userRecord of usersToDelete) {
            const user = userFromObject(userRecord); // Create a User instance using fromObject
            const servers = user.getServerList();
            if(servers > 0) {
                user.deleteDate = null;
                user.save();
                continue;
            }
            console.log(`Deleting user with ID: ${user.id}`);

            // Delete the user from the database
            this.db.query(`DELETE FROM users WHERE id = '${user.id}'`);
            deletedUsers++;
        }

        logger.log(`**Daily Cleanup** | Deleted ${deletedUsers} users in daily cleanup`);
    }

}

module.exports = UserHandler;