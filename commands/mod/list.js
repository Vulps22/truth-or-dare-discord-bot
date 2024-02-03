require('dotenv').config();
const { SlashCommandBuilder, SlashCommandSubcommandBuilder, PermissionsBitField} = require("discord.js");
const Database = require("../../database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('List all Dares|Truths|Guilds')
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('dare')
            .setDescription('View all Dares')
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('truth')
            .setDescription('View all Truths')
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('server')
            .setDescription('View all servers')
        )
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('report')
            .setDescription('View all reports')
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            interaction.reply('You do not have permission to run this command');
            return;
        }
        const subcommand = interaction.options.getSubcommand();

        let id = 0;

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

        if (subcommand !== 'report') {
            interaction.reply(`${subcommand} list is not yet supported`);
        }

        db.list(table).then(target => {
            console.log(target);
            if (!target || target === undefined || target.length === 0) {
                interaction.reply(`${subcommand} does not have any data`);
                return;
            }

            let content = '';

            for (let entry in target) {
                console.log(target[entry]);
                let data = target[entry];
                for (let key in data) {
                    content += `${key} : ${data[key]} \n`;
                }

                content += "\n\n";
            }

            interaction.reply(content);
        })


        //interaction.reply(`Type: ${subcommand}\nReason: ${reason}\nID: ${offender}`);
    }
}
