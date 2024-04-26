require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("node:fs");

const ALPHA = process.env['ALPHA'] ?? false;
const TOKEN = ALPHA ? process.env['aTOKEN'] : process.env['TOKEN'];
const CLIENT_ID = ALPHA ? process.env['aCLIENT_ID'] : process.env['CLIENT_ID'];
const GUILD_ID = ALPHA ? process.env['GUILD_ID'] : null;

const commandPaths = {
    global: "./commands/global",
    mod: "./commands/mod"
};

function loadCommands(path) {
    const commandFiles = fs.readdirSync(path).filter(file => file.endsWith(".js"));
    const commands = [];
    for (const file of commandFiles) {
        const command = require(`${path}/${file}`);
        if (command.data) {
            commands.push({
                data: command.data.toJSON(),
                isDeveloper: command.developer ?? false
            });
        }
    }
    return commands;
}

async function deployCommands(commands, isGlobal) {
    if(ALPHA) isGlobal = false;
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        const data = await rest.put(
            isGlobal ? Routes.applicationCommands(CLIENT_ID) : Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands.map(command => command.data) }
        );
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
}

(async () => {
    const globalCommands = loadCommands(commandPaths.global);
    const guildCommands = globalCommands.filter(command => command.isDeveloper);
    const nonDeveloperGlobalCommands = globalCommands.filter(command => !command.isDeveloper);

    if (guildCommands.length > 0) {
        await deployCommands(guildCommands, false);
    }
    if (nonDeveloperGlobalCommands.length > 0) {
        await deployCommands(nonDeveloperGlobalCommands, true);
    }

    const modCommands = loadCommands(commandPaths.mod);
    await deployCommands(modCommands, false);

})();
