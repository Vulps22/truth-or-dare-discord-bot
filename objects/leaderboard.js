const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const User = require('objects/user');
const { userInfo } = require('os');
const Database = require('objects/database');

class Leaderboard {
    constructor(interaction, client) {
        this.interaction = interaction;
        this.client = client;
    }

    async generateLeaderboard(global = true) {
        const topPlayers = await this.fetchTopPlayers(global);
        const canvas = createCanvas(1500, (250 * 11) + 10);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff8c00';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < topPlayers.length; i++) {
            const player = topPlayers[i];
            await this.drawPlayer(ctx, player, global, i * 250, i + 1);
        }

        await this.drawPlayerPosition(ctx, global);
        return new AttachmentBuilder(canvas.toBuffer());
    }

    async fetchTopPlayers(global = true) {
        let query;
        if (global) {
            query = 'SELECT id FROM users ORDER BY globalLevel DESC, globalLevelXp DESC LIMIT 10';
        } else {
            query = `SELECT DISTINCT user_id 
                     FROM (
                         SELECT user_id 
                         FROM server_users 
                         WHERE server_id = '${this.interaction.guild.id}'
                         ORDER BY server_level DESC, server_level_xp DESC 
                         LIMIT 10
                     ) AS unique_users;`;
        }
        const db = new Database();
        let top = await db.query(query);
        let users = [];

        for (const userInfo of top) {
            let user = new User(userInfo.id || userInfo.user_id);
            let player = await user.get();
            if (!global) player.loadServerUser(this.interaction.guild.id);
            users.push(player);
        }

        return users;
    }

    async drawPlayer(ctx, player, global, y, position, playerPos) {
        const canvasWidth = 1500;
        const avatarX = 300;
        const avatarY = y + 25;
        const avatarSize = 200;
        const textX = avatarX + avatarSize + 150;
        const lineHeight = 40;
        const usernameFontSize = 90;
        const detailsFontSize = 50;
    
        if (position === 11) {
            ctx.fillStyle = '#ccac00';
            ctx.fillRect(0, y + 15, canvasWidth, 250);
        }
    
        const positionFontSize = avatarSize;
        ctx.fillStyle = position === 1 ? '#ffd700' : '#ffffff';
        ctx.font = `bold ${positionFontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const positionText = playerPos ?? position.toString().padStart(2, '0');
        ctx.fillText(positionText, 150, avatarY + (avatarSize / 2));
        ctx.textBaseline = 'top';
    
        let avatarURL = await player.getImage();
        ctx.save();
    
        ctx.beginPath();
        ctx.arc(avatarX + 100, avatarY + 100, 100, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
    
        const avatar = await loadImage(avatarURL);
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    
        ctx.fillStyle = '#ffffff';
        this.drawAndTruncateText(ctx, player.username, textX - 120, avatarY + 60, 700, 60, 90);
    
        let level = global ? player.globalLevel : player._serverLevel;
        this.drawLevel(ctx, level, global, avatarY + 115);
    
        ctx.font = `${detailsFontSize}px sans-serif`;
        ctx.textAlign = 'center';
        const truthsDaresText = `Truths: ${await player.truthsDone()}, Dares: ${await player.daresDone()}`;
        ctx.fillText(truthsDaresText, textX + 100, avatarY + 175);
    }
    

    async drawPlayerPosition(ctx, global = true) {
        let query = `SELECT (SELECT COUNT(*) FROM users u2 WHERE u2.globalLevel > u1.globalLevel OR (u2.globalLevel = u1.globalLevel AND u2.globalLevelXp > u1.globalLevelXp)) + 1 AS position FROM users u1 WHERE u1.id = '${this.interaction.user.id}';`;
        if (!global) {
            query = `SELECT (SELECT COUNT(*) FROM server_users u2 WHERE u2.server_level > u1.server_level OR (u2.server_level = u1.server_level AND u2.server_level_xp > u1.server_level_xp)) + 1 AS position FROM server_users u1 WHERE u1.user_id = '${this.interaction.user.id}';`;
        }
        const db = new Database();
        let position = await db.query(query);
        position = position[0].position;
        let user = new User(this.interaction.user.id);
        await user.load();
        await this.drawPlayer(ctx, user, global, 250 * 10, 11, position);
    }

    drawLevel(ctx, level, global, yPosition) {
        const levelCircle = {
            x: 1500 - 130,
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
