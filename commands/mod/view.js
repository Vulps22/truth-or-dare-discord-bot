require('dotenv').config();
const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandNumberOption, SlashCommandStringOption, WebhookClient } = require("discord.js");
const Database = require("../../database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('view')
        .setDescription('View a Dare|Truth|Guild')
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('dare')
            .setDescription('View the specified Dare')
            .addNumberOption(new SlashCommandNumberOption()
                .setName('id')
                .setRequired(true)
                .setDescription('The ID of the Dare you are viewing')
            )
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('truth')
            .setDescription('View the specified Truth')
            .addNumberOption(new SlashCommandNumberOption()
                .setName('id')
                .setRequired(true)
                .setDescription('The ID of the Truth you are viewing')
            )

        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('server')
            .setDescription('View the specified server')
            .addNumberOption(new SlashCommandNumberOption()
                .setName('id')
                .setRequired(true)
                .setDescription('The ID of the Server you are viewing')
            )
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('report')
            .setDescription('View the specified report')
            .addNumberOption(new SlashCommandNumberOption()
                .setName('id')
                .setRequired(true)
                .setDescription('The ID of the Server you are viewing')
            )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        let id = 0;


        id = interaction.options.getNumber('id');

        let db = new Database();

        let table = 'guilds'
        switch (subcommand) {
            case 'dare':
                table = 'dares';
                break;
            case 'truth':
                table = 'truths';
                break;
            case 'server':
                table = 'guilds';
                break;
            case 'report':
                table = 'reports';
                break;

        }

        db.get(table, id).then(target => {
            if(!target || target === undefined) {
                interaction.reply(`${subcommand} ${id} does not exist`);
                return;
            }

            let content = '';

            for (let key in target) {
                content += `${key} : ${target[key]} \n`;
            }

            interaction.reply(content);
        })


        //interaction.reply(`Type: ${subcommand}\nReason: ${reason}\nID: ${offender}`);
    }
}
