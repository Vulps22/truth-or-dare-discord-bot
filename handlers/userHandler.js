require('dotenv').config();
const { EmbedBuilder, Embed } = require('discord.js');
const User = require('../objects/user.js');
const Handler = require('./handler.js');
const Question = require('../objects/question.js');
const Database = require('../objects/database.js');
const embedder = require('../embedder.js');
const Server = require('../objects/server.js'); // Import the Server class

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
}

module.exports = UserHandler;