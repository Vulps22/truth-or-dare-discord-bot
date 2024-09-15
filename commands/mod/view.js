require('dotenv').config();
const { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandNumberOption, SlashCommandStringOption, WebhookClient } = require("discord.js");
const Database = require("objects/database")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('view')
        .setDescription('View a Dare|Truth|Server')
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

        let table = 'servers'
        switch (subcommand) {
            case 'dare':
                table = 'questions';
                break;
            case 'truth':
                table = 'questions';
                break;
            case 'server':
                table = 'servers';
                break;
            case 'report':
                table = 'reports';
                break;

        }

        db.get(table, id).then(target => {
            if (!target || target === undefined) {
                interaction.reply(`${subcommand} ${id} does not exist`);
                return;
            }

            let content = '';

            for (let key in target) {
                if (key == 'messageId') {
                    content += `${key} : https://discord.com/channels/1079206786021732412/${getChannelId(subcommand)}/${target[key]}`
                } else {
                    content += `${key} : ${target[key]} \n`;
                }
            }

            interaction.reply(content);
        })


        //interaction.reply(`Type: ${subcommand}\nReason: ${reason}\nID: ${offender}`);
    }
}

function getChannelId(subcommand) {

    switch (subcommand) {
        case 'dare':
            return my.dares_log
        case 'truth':
            return my.truths_log
        case 'server':
            return my.servers_log
        case 'report':
            throw new Error("Not Implemented Yet: View Report Message ID");
    }
}
