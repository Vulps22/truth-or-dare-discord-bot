const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

class RankCard {
    constructor(user, username, avatarURL) {
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
        this.drawLevel(ctx);
        this.drawUserStats(ctx);
        this.drawProgressBar(ctx);

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
        const urlParts = this.avatarURL.split('.');
        urlParts[urlParts.length - 1] = 'png'; // Replace the last item with 'png'
        const avatarURL = urlParts.join('.');

        const avatar = await loadImage(avatarURL);
        ctx.drawImage(avatar, 25, 25, 200, 200);
    }

    drawUsername(ctx) {
        ctx.fillStyle = '#ffffff'; // Text color
        ctx.font = '70px sans-serif'; // Text font
        ctx.fillText(this.username, 240, 100);
    }

    drawLevel(ctx) {
        const levelCircle = {
            x: 590, // X coordinate for the level circle
            y: 70,  // Y coordinate for the level circle
            radius: 40 // Radius of the level circle
        };
    
        // Draw the blue circle outline
        ctx.beginPath();
        ctx.arc(levelCircle.x, levelCircle.y, levelCircle.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#4169E1'; // Royal blue color
        ctx.lineWidth = 4; // Set the line width for the circle
        ctx.stroke();
    
        // Draw the level text
        ctx.fillStyle = '#ffffff'; // White color for the text
        ctx.font = '30px sans-serif'; // Adjust the size as needed
        ctx.textAlign = 'center'; // Align text horizontally
        ctx.textBaseline = 'middle'; // Align text vertically
        ctx.fillText(this.user.getLevel(), levelCircle.x, levelCircle.y);
    }
    
    


    drawUserStats(ctx) {
        const xleft = 320; // X coordinate for the left column text
        const xright = 510; // X coordinate for the right column text

        const daresRow = 130; // Y coordinate for the dares row
        const truthsRow = 155; // Y coordinate for the truths row
        const xpRow = 180; // Y coordinate for the XP row

        ctx.font = '20px sans-serif'; // Set a smaller font size for the details
        ctx.fillText(`Truths Done: ${this.user.truthsDone ?? 0}`, xleft, daresRow);
        ctx.fillText(`Truths Failed: ${this.user.truthsFailed ?? 0}`, xright, daresRow);
        ctx.fillText(`Dares Done: ${this.user.daresDone ?? 0}`, xleft, truthsRow);
        ctx.fillText(`Dares Failed: ${this.user.daresFailed ?? 0}`, xright, truthsRow);
        ctx.fillText(`XP: ${this.user.globalXP ?? 0}`, 285, xpRow);
    }

    drawProgressBar(ctx) {
        ctx.fillStyle = '#444444'; // Bar background color
        ctx.fillRect(240, 190, 400, 35);

        const currentLevel = this.user.getLevel();
        const xpForNextLevel = this.user.calculateXpForLevel(currentLevel + 2);
    //    / const progressTowardsNextLevel = this.user.globalXP - xpForCurrentLevel;
        const progressBarWidth = this.calculateProgressBarWidth(this.user.globalXP, xpForNextLevel);

        ctx.fillStyle = '#4169E1'; // Bar fill color
        ctx.fillRect(240, 190, progressBarWidth, 35);
    }

    calculateProgressBarWidth(currentXp, xpForNextLevel) {
        // Calculate the percentage of XP gained towards the next level
        const xpPercentage = (currentXp / xpForNextLevel);
      
        // Calculate the width of the progress bar in pixels based on the percentage
        const progressBarWidth = xpPercentage * 400;
      
        // Ensure that progress bar width does not exceed 400
        return Math.min(progressBarWidth, 400);
      }
      

}

module.exports = RankCard;