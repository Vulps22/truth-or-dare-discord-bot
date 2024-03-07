require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("node:fs");

const ALPHA = process.env['ALPHA'] ?? false;

const TOKEN = ALPHA ? process.env['aTOKEN'] : process.env['TOKEN']
const CLIENT_ID = ALPHA ? process.env['aCLIENT_ID'] : process.env['CLIENT_ID']
const GUILD_ID = process.env['GUILD_ID']



const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs
	.readdirSync("./commands/mod")
	.filter((file) => file.endsWith(".js"));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
	const command = require(`./commands/mod/${file}`);
	if(!command.data) continue;
	commands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: "10" }).setToken(TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(
			`Started refreshing ${commands.length} application (/) commands.`
		);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
			{ body: commands }
		);

		console.log(
			`Successfully reloaded ${data.length} application (/) commands.`
		);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();