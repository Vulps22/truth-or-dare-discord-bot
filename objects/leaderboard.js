const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const User = require('./user');
const { userInfo } = require('os');
const Database = require('./database');

class Leaderboard {
    constructor(interaction, client) {
        this.interaction = interaction;
        this.client = client;
    }

    async generateLeaderboard() {
        // Fetch the top 10 players from your database
        const topPlayers = await this.fetchTopPlayers();
        
        // Create a canvas with the same width as the rank card and a height based on the number of players
        const canvas = createCanvas(1500, (250 * 11) + 10); // Width matches the rank card
        const ctx = canvas.getContext('2d');

        // Set the background color to match the rank card's background color
        ctx.fillStyle = '#ff8c00'; // Dark orange color
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw each player's information
        for (let i = 0; i < topPlayers.length; i++) {
            const player = topPlayers[i];
            await this.drawPlayer(ctx, player, i * 250, i+1); // Adjust the y-coordinate based on the player's index
        }

        await this.drawPlayerPosition(ctx);

        // Return the canvas as an image
        return new AttachmentBuilder(canvas.toBuffer());
    }

    async fetchTopPlayers() {
        const db = new Database();
        let top = await db.query('SELECT id FROM users ORDER BY global_xp DESC LIMIT 10');
        let users = []; // Make sure to declare the variable properly with 'let' or 'const'

        for (const userInfo of top) {
            let user = new User(userInfo.id);
            let player = await user.get();
            users.push(player); // Ensure that you push 'player' into the array
        }

        return users; // Return the populated 'users' array instead of an empty array
    }

    async drawPlayer(ctx, player, y, position, playerPos) {
        const canvasWidth = 1500; // Replace with your canvas width
        const avatarX = 300;
        const avatarY = y + 25;
        const avatarSize = 200;
        const textX = avatarX + avatarSize + 150;
        const lineHeight = 40; // Adjust for better spacing
        const usernameFontSize = 90; // Bigger font for the username
        const detailsFontSize = 50; // Smaller font for details


        if(position === 11) {
            ctx.fillStyle = '#ccac00'; // Slightly darker gold color
            ctx.fillRect(0, y+15, canvasWidth, 250);
        }


        const positionFontSize = avatarSize;
        ctx.fillStyle = position === 1 ? '#ffd700' : '#ffffff'; // Gold color for first place, white for others
        ctx.font = `bold ${positionFontSize}px sans-serif`;
        ctx.textAlign = 'center'; // Center the text on the x coordinate
        ctx.textBaseline = 'middle'; // Center the text on the y coordinate
        const positionText = playerPos ?? position.toString().padStart(2, '0'); // Ensure 2-digit position

        ctx.fillText(positionText, 150, avatarY + (avatarSize / 2)); // Adjust as necessary
        ctx.textBaseline = 'top'; // Reset the text baseline for the rest of the text
        // Hardcoded user ID for testing
       // const testUserID = '914368203482890240'; // Replace 'YOUR_USER_ID' with your actual user ID
        //player.id = testUserID;
        console.log(player.id)
        // Use the hardcoded user ID to fetch the avatar
        let avatarURL = this.client.users.cache.get(player.id).avatarURL()

        // Fetching the avatar URL and ensuring it's a PNG
        const urlParts = avatarURL.split('.');
        urlParts[urlParts.length - 1] = 'png'; // Ensure the extension is 'png'
        avatarURL = urlParts.join('.');


        // Save the canvas state before drawing the avatar
        ctx.save();

        // Draw circular clip for the avatar
        ctx.beginPath();
        ctx.arc(avatarX + 100, avatarY + 100, 100, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        // Load the avatar
        const avatar = await loadImage(avatarURL);
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);

        // Restore the canvas state to unclip
        ctx.restore();

        // Draw the username with a larger font
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${usernameFontSize}px sans-serif`;
        ctx.fillText(player.username, textX + 70, avatarY + 20);

        this.drawLevel(ctx, player.getLevel(), avatarY + 70);


        // Set the font for the smaller details
        ctx.font = `${detailsFontSize}px sans-serif`;

        // Calculate the position for the XP and level, aligning it to the right
        const xpText = `XP: ${player.globalXP}`;
        const levelText = `Level: ${player.getLevel()}`;
        const xpTextWidth = ctx.measureText(xpText).width;
        const levelTextWidth = ctx.measureText(levelText).width;
        const rightAlignX = canvasWidth - 20; // Right margin of 20px
        ctx.textAlign = 'right';
        // Draw the level and XP on the right side



        ctx.fillText(xpText, rightAlignX, avatarY + 175);
        ctx.textAlign = 'center';
        // Draw the truths and dares
        const truthsDaresText = `Truths: ${await player.truthsDone()}, Dares: ${await player.daresDone()}`;
        ctx.fillText(truthsDaresText, textX + 100, avatarY + 175);
    }

    async drawPlayerPosition(ctx) {
        const db = new Database();
        let position = await db.query("SELECT (SELECT COUNT(*) FROM users u2 WHERE u2.global_xp > u1.global_xp) + 1 AS position FROM users u1 WHERE u1.id = '914368203482890240'");
        position = position[0].position;
        let positionText = `Position: ${position}`;
        let user = new User(this.interaction.user.id);
        user.load();

       await this.drawPlayer(ctx, user, 250*10, 11, position);

    }


    drawLevel(ctx, level, yPosition) {
        const levelCircle = {
            x: 1500 - 90, // X coordinate for the level circle
            y: yPosition,  // Y coordinate for the level circle
            radius: 60 // Radius of the level circle
        };

        console.log('level', level);

        // Draw the blue circle outline
        ctx.beginPath();
        ctx.arc(levelCircle.x, levelCircle.y, levelCircle.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#4169E1'; // Royal blue color
        ctx.lineWidth = 4; // Set the line width for the circle
        ctx.stroke();
    
        // Draw the level text
        ctx.fillStyle = '#ffffff'; // White color for the text
        ctx.font = '70px sans-serif'; // Adjust the size as needed
        ctx.textAlign = 'center'; // Align text horizontally
        ctx.textBaseline = 'middle'; // Align text vertically
        ctx.fillText(level, levelCircle.x, levelCircle.y);
    }


}

module.exports = Leaderboard;