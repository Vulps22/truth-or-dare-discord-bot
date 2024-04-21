const { SlashCommandBuilder } = require("discord.js");
const DareHandler = require("../../handlers/dareHandler");
const TruthHandler = require("../../handlers/truthHandler");
const UserHandler = require("../../handlers/userHandler");
const RankCard = require("../../objects/rankCard");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rank')
		.setDescription('View Your Rank and XP!'),
	async execute(interaction) {
        const handler = new UserHandler();
        const user = await handler.getUser(interaction.user.id, interaction.user.username);
        if (!user) {
            interaction.reply("Hmm, I can't find your user data. This might be a bug, try again later");
            return;
        }
        let rankCard = new RankCard(user, interaction.user.username, interaction.user.displayAvatarURL());
        let card = await rankCard.generateCard();
        interaction.reply({ files: [card] });
		
	}
}