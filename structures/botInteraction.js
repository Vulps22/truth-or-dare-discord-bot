// /structures/BotInteraction.js
const { MessageFlags, Interaction, PermissionsBitField } = require('discord.js');

class BotInteraction {
    /**
     * @param {Interaction} interaction The original interaction from discord.js
     */
    constructor(interaction) {
        this._interaction = interaction;
    }

    // --- PROXY PROPERTIES ---
    get user() { return this._interaction.user; }
    get member() { return this._interaction.member; }
    get channel() { return this._interaction.channel; }
    get guild() { return this._interaction.guild; }
    get client() { return this._interaction.client; }
    get customId() { return this._interaction.customId; }
    get deferred() { return this._interaction.deferred; }
    get replied() { return this._interaction.replied; }
    get options() { return this._interaction.options; }
    get commandName() { return this._interaction.commandName; }
    get id() { return this._interaction.id; }
    get guildId() { return this._interaction.guildId; }
    get values() { return this._interaction.values; }
    get messageId() { return this._interaction.message?.id || null; }

        get action() { return this._customData.action; }
    get baseId() { return this._baseId; }
    get buttonData() { return this._customData; }
    get customIdRaw() { return this._interaction.customId; }
    /**
     * @returns {Map<string, string>} The parameters extracted from the custom ID.
     */
    get params() { return this._customData.params; }
    get prefix() { return this._customData.prefix; }

    // --- PROXY METHODS ---
    reply(options) { return this._interaction.reply(options); }
    editReply(options) { return this._interaction.editReply(options); }
    deferReply(options) { return this._interaction.deferReply(options); }
    update(options) { return this._interaction.update(options); }


    // --- YOUR CUSTOM METHODS ---
    async sendReply(content, options = {}) {
        // FIX 2: Build a new options object instead of modifying the one passed in.
        // This makes the function "pure" and avoids side effects.
        const replyOptions = { ...options };
        if (typeof content === 'string' && content.length > 0) {
            replyOptions.content = content;
        }

        if (this.deferred || this.replied) {
            return this.editReply(replyOptions);
        } else {
            return this.reply(replyOptions);
        }
    }

    async ephemeralReply(content, options = {}) {
        const existingFlags = options.flags || 0;
        const combinedFlags = existingFlags | MessageFlags.Ephemeral;
        const finalOptions = { ...options, flags: combinedFlags };

        return this.sendReply(content, finalOptions);
    }

    isAdministrator() {
        // Check if the user has the Administrator permission
        return this.member.permissions.has(PermissionsBitField.Flags.Administrator);
    }

    _parseCustomId() {
        const parts = this._interaction.customId.split('_');
        console.log('Parsing customId:', this._interaction.customId);
        console.log('Parts:', parts);
        const prefix = parts[0] || null;
        const action = parts[1] || null;
        const paramParts = parts.slice(2);
        console.log(paramParts);
        // Initialize buttonData. params will ALWAYS be a Map.
        this._customData = {
            prefix,
            action,
            params: new Map(),
        };

        // Loop through the parameter parts and enforce the key:value format.
        for (const part of paramParts) {
            // Check if the part contains our key-value separator ':'
            if (part.includes(':')) {
                const [key, value] = part.split(':', 2); // Split only on the first ':'
                this._customData.params.set(key, value);
                console.log(this._customData.params);
            } else {
                // If a part is not in key:value format, it's an error.
                throw new Error(`Invalid customId format. Parameter "${part}" is missing a key. Expected format 'key:value'.`);
            }
        }

        // Set the baseId as before
        if (prefix && action) {
            this._baseId = `${prefix}_${action}`;
            console.log('Base ID:', this._baseId);
        }
    }
}

module.exports = { BotInteraction };