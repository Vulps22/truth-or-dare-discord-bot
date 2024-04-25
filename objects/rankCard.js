const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const User = require('./user');

class RankCard {
    constructor(user, username, avatarURL) {
        /**@type {User} */
        this.user = user;
        this.username = username;
        this.avatarURL = avatarURL;
    }

    async generateCard() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');

        this.drawBackground(ctx);
        await this.drawAvatar(ctx);
        this.drawUsername(ctx);
        this.drawLevels(ctx);
        await this.drawUserStats(ctx);
        this.drawProgressBars(ctx);

        return new AttachmentBuilder(canvas.toBuffer());
    }

    createCanvas() {
        return createCanvas(700, 250);
    }

    drawBackground(ctx) {
        ctx.fillStyle = '#ff8c00'; // Dark orange color
        ctx.fillRect(0, 0, 700, 250);
    }

    async drawAvatar(ctx) {
        if (this.avatarURL == 'testMode') return;
        const urlParts = this.avatarURL.split('.');
        urlParts[urlParts.length - 1] = 'png'; // Replace the last item with 'png'
        const avatarURL = urlParts.join('.');

        const avatar = await loadImage(avatarURL);
        ctx.drawImage(avatar, 25, 25, 200, 200);
    }

    drawUsername(ctx) {
        ctx.fillStyle = '#ffffff'; // Text color
        this.drawAndTruncateText(ctx, this.username, 240, 70, 260, 30, 70);
    }

    drawLevels(ctx) {
        this.drawGlobalLevel(ctx);
        this.drawServerLevel(ctx);
    }

    drawGlobalLevel(ctx) {
        const globalLevelCircle = {
            x: 550, // X coordinate for the level circle
            y: 70,  // Y coordinate for the level circle
            radius: 35 // Radius of the level circle
        };

        const level = this.user.globalLevel;
        console.log('level', level);

        // Draw the blue circle outline
        ctx.beginPath();
        ctx.arc(globalLevelCircle.x, globalLevelCircle.y, globalLevelCircle.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#4169E1'; // Royal blue color
        ctx.lineWidth = 4; // Set the line width for the circle
        ctx.stroke();

        // Draw the level text
        ctx.fillStyle = '#ffffff'; // White color for the text
        ctx.font = '30px sans-serif'; // Adjust the size as needed
        ctx.textAlign = 'center'; // Align text horizontally
        ctx.textBaseline = 'middle'; // Align text vertically
        ctx.fillText(level, globalLevelCircle.x, globalLevelCircle.y);
    }

    drawServerLevel(ctx) {
        const globalLevelCircle = {
            x: 630, // X coordinate for the level circle
            y: 70,  // Y coordinate for the level circle
            radius: 35 // Radius of the level circle
        };

        const level = this.user.serverLevel;

        // Draw the blue circle outline
        ctx.beginPath();
        ctx.arc(globalLevelCircle.x, globalLevelCircle.y, globalLevelCircle.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#2e8b57'; // Dark Green color
        ctx.lineWidth = 4; // Set the line width for the circle
        ctx.stroke();

        // Draw the level text
        ctx.fillStyle = '#ffffff'; // White color for the text
        ctx.font = '30px sans-serif'; // Adjust the size as needed
        ctx.textAlign = 'center'; // Align text horizontally
        ctx.textBaseline = 'middle'; // Align text vertically
        ctx.fillText(level, globalLevelCircle.x, globalLevelCircle.y);
    }


    async drawUserStats(ctx) {
        const xleft = 320; // X coordinate for the left column text
        const xright = 510; // X coordinate for the right column text

        const daresRow = 130; // Y coordinate for the dares row
        const truthsRow = 155; // Y coordinate for the truths row
        const xpRow = 180; // Y coordinate for the XP row
        const serverXpRow = 235; // Y coordinate for the XP row

        let stats = await this.getStats();

        ctx.font = '20px sans-serif'; // Set a smaller font size for the details
        ctx.fillText(`Truths Done: ${stats.truthsDone ?? 0}`, xleft, daresRow);
        ctx.fillText(`Truths Failed: ${stats.truthsFailed ?? 0}`, xright, daresRow);
        ctx.fillText(`Dares Done: ${stats.daresDone ?? 0}`, xleft, truthsRow);
        ctx.fillText(`Dares Failed: ${stats.daresFailed ?? 0}`, xright, truthsRow);
        ctx.textAlign = 'left'; // Align text to the left for the XP row
        ctx.fillText(`Global XP: ${this.user.globalLevelXP ?? 0} / ${this.user.calculateXpForLevel(this.user.globalLevel + 1)}`, 240, xpRow);
        ctx.fillText(`Server XP: ${this.user.serverLevelXP ?? 0} / ${this.user.calculateXpForLevel(this.user.ServerLevel + 1)}`, 240, serverXpRow);
        ctx.textAlign = 'center'; // Reset text alignment to 'center'
    }

    async getStats() {
        let stats = {
            truthsDone: await this.user.truthsDone(),
            truthsFailed: await this.user.truthsFailed(),
            daresDone: await this.user.daresDone(),
            daresFailed: await this.user.daresFailed()
        };

        return stats;
    }

    drawProgressBars(ctx) {
        ctx.fillStyle = '#444444'; // Bar background color
        ctx.fillRect(240, 190, 400, 35);

        const currentLevel = this.user.globalLevel;
        const xpForNextLevel = this.user.calculateXpForLevel(currentLevel + 2);
        const progressBarWidth = this.calculateProgressBarWidth(this.user.globalLevelXP, xpForNextLevel);

        const currentServerLevel = this.user.ServerLevel;
        const xpForNextServerLevel = this.user.calculateXpForLevel(currentServerLevel + 2);
        const progressBarWidthServer = this.calculateProgressBarWidth(this.user.serverLevelXP, xpForNextServerLevel);


        ctx.fillStyle = '#4169E1'; // Server Bar fill color
        ctx.fillRect(240, 190, progressBarWidth, 17.5);
        ctx.fillStyle = '#2e8b57'; // Server Bar fill color
        ctx.fillRect(240, 190 + 17.5, progressBarWidthServer, 17.5);
    }

    calculateProgressBarWidth(currentXp, xpForNextLevel) {
        // Calculate the percentage of XP gained towards the next level
        const xpPercentage = (currentXp / xpForNextLevel);

        // Calculate the width of the progress bar in pixels based on the percentage
        const progressBarWidth = xpPercentage * 400;

        // Ensure that progress bar width does not exceed 400
        return Math.min(progressBarWidth, 400);
    }

    drawAndTruncateText(ctx, text, x, y, maxWidth, minFontSize, maxFontSize) {

        let fontSize = maxFontSize;  // Starting font size
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'left'; // Align text horizontally
        ctx.textBaseline = 'middle'; // Align text vertically
        // Scale down the font size until it fits or reaches the minimum font size
        while (ctx.measureText(text).width > maxWidth && fontSize > minFontSize) {
            fontSize--;
            ctx.font = `${fontSize}px Arial`;
        }
    
        // If the text still doesn't fit, truncate it
        if (ctx.measureText(text).width > maxWidth) {
            while (ctx.measureText(text + '...').width > maxWidth) {
                text = text.slice(0, -1);
            }
            text += '...';
        }
    
        ctx.fillText(text, x, y); // Draw the text at the desired location (adjust y as needed)
    }

}

module.exports = RankCard;