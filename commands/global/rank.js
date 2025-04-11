const { SlashCommandBuilder, SlashCommandUserOption } = require("discord.js");
const RankCommandExecutionTimeError = require("errors/rankCommandExecutionTimeError");
const UserHandler = require("handlers/userHandler");
const RankCard = require("objects/rankCard");
const Server = require("objects/server");
const User = require("objects/user");

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
    /**
     * 
     * @param {import("discord.js").Interaction} interaction 
     * @returns 
     */
    async execute(interaction) {
        if (!interaction.deferred) await interaction.deferReply();
        const startTime = Date.now();

        let discordUser = interaction.options.getUser('user');
        let user_id;
        if (discordUser) user_id = interaction.options.getUser('user').id;
        else user_id = interaction.user.id;

        const handler = new UserHandler();

        /** @type {User} */
        const user = await handler.getUser(user_id);

        if (!user) {
            interaction.editReply("Hmm, I can't find your user data. This might be a bug, try again later");
            return;
        }

        await user.loadServerUser(interaction.guild.id);
        if(!user._server) {
            user._server = new Server(interaction.guild.id);
            await user._server.load();
        }
        let image = await user.getImage();
        let rankCard = new RankCard(user, image, user._server.hasPremium());
        let card = await rankCard.generateCard();
        
        const executionTime = Date.now() - startTime;
        if (executionTime > 5000) {
            throw new RankCommandExecutionTimeError(executionTime);
        }
        
        await interaction.editReply({ files: [card] });
        console.log(`Rank command executed in ${executionTime}ms`);
    }
}