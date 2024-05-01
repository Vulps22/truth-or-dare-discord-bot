const { SlashCommandBuilder, SlashCommandUserOption } = require("discord.js");
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
    nsfw: false,
    administrator: false,
    async execute(interaction) {
        let discordUser = interaction.options.getUser('user');
        let user_id;
        if (discordUser) user_id = interaction.options.getUser('user').id;
        else user_id = interaction.user.id;

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