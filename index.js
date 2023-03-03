const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { modCommands, globalCommands } = require('./command.js');
const keep_alive = require('./keep_alive.js');
const Database = require("@replit/database");
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const DareHandler = require('./dareHandler.js'); // import DareHandler
const TruthHandler = require('./truthHandler.js'); // import TruthHandler
const UserHandler = require('./userHandler.js'); // import TruthHandler
const Question = require('./question.js');

const TOKEN = process.env['TOKEN']
const CLIENT_ID = process.env['CLIENT_ID']
const GUILD_ID = process.env['GUILD_ID']


const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const db = new Database()
db.get("dares").then((dares) => {
  db.get("truths").then((truths) => {
    console.log("loaded: ", dares.length + truths.length)
  })
})
/*db.set("dares", [])
db.set("truths", [])*/
//updateCommands();
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

});

client.on('interactionCreate', async interaction => {

  if (!interaction.isCommand()) return;
  try {
    console.log(interaction.guild.name);
    const key = `guild${interaction.guildId}`
    const guild = await new UserHandler().findGuild(key)
    console.log(guild)
    if ((!guild || !guild.hasAccepted) && !(interaction.commandName === "setup" || interaction.commandName === "accept-terms")) {
      interaction.reply("A community Administrator must first run the /setup command before you can use me");
      console.log("A community Administrator must first run the /setup command before you can use me")
      return;
    }

    if (guild && (guild.name === undefined || guild.name === null)){
      guild.name = interaction.guild.name;
      db.set(key, guild).then(() => {
        console.log(
          "Server updated with name"
        )
      })
    }

    if (!interaction.channel.nsfw) {
      interaction.reply("My commands can only be used on channels marked as NSFW")
      return;
    }

    if (interaction.commandName === "accept-terms" || interaction.commandName === "setup") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        interaction.reply("Only an administrator can run setup commands or accept my terms")
        return;
      } else {
        if (interaction.commandName === "setup") {
          new UserHandler().startSetup(interaction);
          return;
        }
        if (interaction.commandName === "accept-terms") {
          new UserHandler().acceptSetup(interaction);
          return;
        }
      }
    }

    switch (interaction.commandName) {
      case 'createdare':
        new DareHandler(client).createDare(interaction);
        break;
      case 'dare':
        new DareHandler(client).dare(interaction);
        break;
      case 'createtruth':
        new TruthHandler(client).createTruth(interaction);
        break;
      case 'truth':
        new TruthHandler(client).truth(interaction);
        break;
      case 'register':
        interaction.reply("WIP");
        break;
      case 'ban-truth':
        new TruthHandler().ban(interaction);
        break;
      case 'ban-dare':
        new DareHandler().ban(interaction);
        break;
      case 'list-dares':
        new DareHandler(client).listAll(interaction);
        interaction.reply("Here's your List of Dares!");
        break;
      case 'list-truths':
        new TruthHandler(client).listAll(interaction);
        interaction.reply("Here's your List of Truths!");
        break;
      case 'givedare':
        new DareHandler(client).giveDare(interaction);
        break;
      case 'update-commands':
        updateCommands(interaction);
        break;
      case 'random':
        randomSelection(interaction);
        break;
      default:
        interaction.reply("This command does not exist. try /dare, or /truth");

    }
  } catch (error) {
    console.error(error);
    interaction.reply({
      content: 'Woops! Brain Fart! Try another command while I work out what went wrong :thinking:',
      ephemeral: true
    });
  }
});

function randomSelection(interaction) {
  const random = Math.floor(Math.random() * 2);
  if (random == 1) new DareHandler(client).dare(interaction);
  else new TruthHandler(client).truth(interaction);
}


function updateCommands(interaction = null) {
  const rest = new REST({ version: '9' }).setToken(TOKEN);

  (async () => {
    try {
      console.log('Started refreshing application (/) commands.');

      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: globalCommands },
      );

      console.log("Global Commands Updated")
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: modCommands },
      );
      console.log("Moderator Commands Updated")

      console.log('Successfully reloaded application (/) commands.');
      if (interaction !== null) interaction.reply("Successfully reloaded application (/) commands.")
    } catch (error) {
      console.error(error);
      console.log("Command update Failed with Error")
      if (interaction !== null) interaction.reply("Command update failed with an error. Check console log for details...")
    }
  })();
}

client.login(process.env['TOKEN']);
