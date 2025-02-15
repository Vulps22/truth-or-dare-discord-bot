const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const Database = require('objects/database');

// Static cache shared across all instances
const avatarCache = new Map();
const CACHE_DURATION = 2400 * 60 * 60; // 24 hours in milliseconds

class Leaderboard {
    constructor(interaction, client, canvasWidth = 1500, baseCanvasHeight = 250, padding = 10) {
        this.interaction = interaction;
        this.client = client;
        this.canvasWidth = canvasWidth;
        this.baseCanvasHeight = baseCanvasHeight;
        this.padding = padding;
    }

    // Clean old cache entries
    static cleanCache() {
        const now = Date.now();
        for (const [key, value] of avatarCache.entries()) {
            if (now - value.timestamp > CACHE_DURATION) {
                avatarCache.delete(key);
            }
        }
    }

    async getPlayerAvatar(playerId) {
        // Clean old entries periodically
        if (Math.random() < 0.1) { // 10% chance to clean on each call
            Leaderboard.cleanCache();
        }

        const now = Date.now();
        const cached = avatarCache.get(playerId);

        // Return cached avatar if it exists and isn't expired
        if (cached && (now - cached.timestamp < CACHE_DURATION)) {
            return cached.avatar;
        }

        try {
            const user = await this.client.users.fetch(playerId);
            const avatar = await loadImage(user.displayAvatarURL({ extension: 'png' }));

            // Store avatar with timestamp
            avatarCache.set(playerId, {
                avatar,
                timestamp: now
            });

            return avatar;
        } catch (error) {
            console.error(`Failed to load avatar for user ${playerId}:`, error);
            return null;
        }
    }

    async generateLeaderboard(global = true) {
        try {
            // Fetch data first
            const topPlayers = await this.fetchTopPlayers(global);

            if (topPlayers.length === 0) {
                await this.interaction.reply('No players available for the leaderboard.');
                return;
            }

            // Setup canvas
            const canvasHeight = (this.baseCanvasHeight * (topPlayers.length + 1)) + this.padding;
            const canvas = createCanvas(this.canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');

            // Draw background
            ctx.fillStyle = '#ff8c00';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Parallelize avatar fetching and drawing
            const drawOperations = topPlayers.map((player, index) =>
                this.drawPlayer(ctx, player, global, index * this.baseCanvasHeight, index + 1)
            );

            // If we have players, also fetch current user's position in parallel
            if (topPlayers.length > 0) {
                drawOperations.push(this.drawUserPosition(ctx, global));
            }

            // Wait for all drawing operations to complete
            await Promise.all(drawOperations);

            return new AttachmentBuilder(canvas.toBuffer());
        } catch (error) {
            console.error('Error generating leaderboard:', error);
            await this.interaction.reply('An error occurred while generating the leaderboard.');
        }
    }

    async fetchTopPlayers(global = true) {
        let query;

        if (global) {
            // Global query, only counting user_questions from the last 30 days
            query = `SELECT * FROM global_leaderboard_top10 ORDER BY position;`;
        } else {
            // Server-specific query, only counting user_questions from the last 30 days
            query = `
                SELECT * FROM tord.server_leaderboard_top10 WHERE server_id = '${this.interaction.guild.id}' ORDER BY position;
            `;
        }

        const db = new Database();
        return await db.query(query);
    }


    async drawPlayer(ctx, player, global, y, position, playerPos) {
        try {
            // Use the cached avatar getter instead of direct fetch
            const avatar = await this.getPlayerAvatar(player.id);
            if (!avatar) {
                console.error(`Could not load avatar for player ${player.id}`);
                return; // Skip avatar drawing if we couldn't get it
            }

            const avatarX = 300;
            const avatarY = y + 25;
            const avatarSize = 200;
            const textX = avatarX + avatarSize + 150;

            if (position === 11) {
                this.drawHighlightBackground(ctx, y);
            }

            // Draw position and other elements
            this.drawPosition(ctx, position, playerPos, avatarY, avatarSize);
            this.drawUsername(ctx, player.username, textX, avatarY);
            this.drawLevel(ctx, player.globalLevel, global, avatarY + 115);
            this.drawStats(ctx, player.truths_done, player.dares_done, textX, avatarY);

            // Draw the avatar
            await this.drawAvatar(ctx, avatar, avatarX, avatarY, avatarSize);
        } catch (error) {
            console.error(`Error drawing player ${player.id}:`, error);
            // Continue with other players if one fails
        }
    }

    drawHighlightBackground(ctx, y) {
        ctx.fillStyle = '#ccac00';
        ctx.fillRect(0, y + 15, this.canvasWidth, 250);
    }

    drawPosition(ctx, position, playerPos, avatarY, avatarSize) {
        const positionFontSize = avatarSize;
        ctx.fillStyle = position === 1 ? '#ffd700' : '#ffffff';
        ctx.font = `bold ${positionFontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const positionText = Number(playerPos ?? position).toString().padStart(2, '0');
        ctx.fillText(positionText, 150, avatarY + (avatarSize / 2));
        ctx.textBaseline = 'top';
    }

    async drawAvatar(ctx, avatar, avatarX, avatarY, avatarSize) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + 100, avatarY + 100, 100, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    }

    drawUsername(ctx, username, textX, avatarY) {
        ctx.fillStyle = '#ffffff';
        this.drawAndTruncateText(ctx, username, textX - 120, avatarY + 60, 700, 60, 90);
    }

    drawStats(ctx, truthsDone, daresDone, textX, avatarY) {
        const detailsFontSize = 50;
        ctx.font = `${detailsFontSize}px sans-serif`;
        ctx.textAlign = 'center';
        const truthsDaresText = `Truths: ${truthsDone}, Dares: ${daresDone}`;
        ctx.fillText(truthsDaresText, textX + 100, avatarY + 175);
    }

    /**
     * Draws the user's position on the leaderboard at the bottom of the canvas.
     * @param {CanvasRenderingContext2D} ctx - The canvas context.
     * @param {boolean} global - Whether to draw the global leaderboard or the server leaderboard.
     */
    async drawUserPosition(ctx, global = true) {
        const db = new Database();
        const userQuery = global ? `
            SELECT * FROM global_leaderboard_user_position
            WHERE id = '${this.interaction.user.id}'
        ` : `
            SELECT * FROM server_leaderboard_top10
            WHERE id = '${this.interaction.user.id}' AND server_id = '${this.interaction.guild.id}'
        `;
        let user = await db.query(userQuery);
        user = user[0];
        await this.drawPlayer(ctx, user, global, this.baseCanvasHeight * 10, 11, user.position);
    }

    /**
 * Draws the level circle on the leaderboard.
 * 
 * @param {CanvasRenderingContext2D} ctx - The canvas context used for drawing.
 * @param {number} level - The level to display inside the circle.
 * @param {boolean} global - Whether the level is global or server-specific. Determines the circle's color.
 * @param {number} yPosition - The y-coordinate position where the circle should be drawn.
 */
    drawLevel(ctx, level, global, yPosition) {
        const levelCircle = {
            x: this.canvasWidth - 130,
            y: yPosition,
            radius: 95
        };
        ctx.beginPath();
        ctx.arc(levelCircle.x, levelCircle.y, levelCircle.radius, 0, Math.PI * 2);
        ctx.strokeStyle = global ? '#4169E1' : '#2e8b57';
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '80px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(level, levelCircle.x, levelCircle.y);
    }

    drawAndTruncateText(ctx, text, x, y, maxWidth, minFontSize, maxFontSize) {
        let fontSize = maxFontSize;
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        while (ctx.measureText(text).width > maxWidth && fontSize > minFontSize) {
            fontSize--;
            ctx.font = `${fontSize}px Arial`;
        }

        if (ctx.measureText(text).width > maxWidth) {
            while (ctx.measureText(text + '...').width > maxWidth) {
                text = text.slice(0, -1);
            }
            text += '...';
        }
        ctx.fillText(text, x, y);
    }
}

module.exports = Leaderboard;
