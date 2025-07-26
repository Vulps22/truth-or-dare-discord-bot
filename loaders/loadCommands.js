const fs = require('node:fs');
const path = require('node:path');

function loadCommands(client, type) {
    const commandsPath = path.join(__dirname, `../commands/${type}`);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    commandFiles.forEach(file => {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
        } else {
            console.warn(`[WARNING] The command at ${filePath} is missing a required 'data' or 'execute' property`);
        }
    });

    console.log(`Loaded ${commandFiles.length} ${type} commands.`);
}

module.exports = loadCommands;
