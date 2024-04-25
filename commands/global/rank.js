const { SlashCommandBuilder, SlashCommandUserOption } = require("discord.js");
const DareHandler = require("../../handlers/dareHandler");
const TruthHandler = require("../../handlers/truthHandler");
const UserHandler = require("../../handlers/userHandler");
const RankCard = require("../../objects/rankCard");
const User = require("../../objects/user");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rank')
		.setDescription('View Your Rank and XP!')
        .addUserOption(new SlashCommandUserOption()
        .setName('user')
        .setDescription('The user you want to view the rank of')
        .setRequired(false)
    ),
	async execute(interaction) {
        let user_id = interaction.options.getUser('user').id;
        if(!user_id) user_id = interaction.user.id;
        console.log(user_id);
        const handler = new UserHandler();
        
        /** @type {User} */
        const user = await handler.getUser(user_id);
        
        if (!user) {
            interaction.reply("Hmm, I can't find your user data. This might be a bug, try again later");
            return;
        }
        await user.loadServerUser(interaction.guildId);
        let image = await user.getImage();
        let rankCard = new RankCard(user, image);
        let card = await rankCard.generateCard();
        interaction.reply({ files: [card] });
		
	}
}