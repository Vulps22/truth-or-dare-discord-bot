const { Events, Interaction } = require("discord.js");
const UserHandler = require("handlers/userHandler");
const Database = require("objects/database");
const Server = require("objects/server");
const User = require("objects/user");
const ButtonEventHandler = require("handlers/buttonEventHandler");
const logger = require("objects/logger");
const BanHandler = require("handlers/banHandler");
const embedder = require("embedder");

let logInteraction = '';

module.exports = {
    name: Events.InteractionCreate,
    /**
     * 
     * @param {Interaction} interaction 
     * @returns 
     */
    async execute(interaction) {

        const didBan = await registerServer(interaction);
        if (didBan === -1) {
            interaction.reply({content: "Oops! It looks like you tried to give me a command in DM. I don't currently support this. But if you join my support server and ask for it, my developer can look into it.", embeds: [embedder.help(false)]})
            return;
        }
        if (didBan) {
            interaction.reply({ content: "You have been banned from using this bot", ephemeral: true });
            return;
        }
        await registerServerUser(interaction);

        let user;
        try {
            user = await new User(interaction.user.id, interaction.user.username).get();
        } catch (error) {
            console.error('Error getting user:', error);
            return;
        }

        if (!user) {
            logger.error(`**Failed to create User during InteractionCreate** | **server**: ${interaction.guild.name}`);
        }

        if (user.isBanned) {
            logger.log("Interaction Aborted: A banned user attempted to interact with the bot");
            interaction.reply({ content: "You have been banned from using Truth Or Dare Online 18+", ephemeral: true });
            return;
        }

        if(user.username !== interaction.user.username) {
            user.username = interaction.user.username;
            await user.save();
        }

        if (isMaintenance() && interaction.guildId !== my.guildId) {
            logger.log("Interaction Aborted: Maintenance Mode.");
            interaction.reply('Truth Or Dare Online 18+ has been disabled globally for essential maintenance: ' + my.maintenance_reason);
            return;
        }

        const server = new Server(interaction.guildId);
        await server.load();

        if (interaction.isAutocomplete()) {
            await handleAutoComplete(interaction);
            return;
        }

        if (interaction.isButton()) {
            logInteraction = `**Button**: ${interaction.customId} | **Server**: ${server.name} - ${server.id} | **User**: ${interaction.user.username} - ${interaction.user.id} ||`
            interaction.logInteraction = logInteraction;
            interaction.logMessage = await logger.log(`${logInteraction} Executing Button Press`);
            await new ButtonEventHandler(interaction).execute();
            return;
        }

        if (interaction.isChatInputCommand()) {
            if (!hasPermission(interaction)) return;
            await runCommand(interaction);
        }
    }
};

async function handleAutoComplete(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        if (command.autocomplete) {
            await command.autocomplete(interaction);
        }
    } catch (error) {
        console.error(`Error executing autocomplete for ${interaction.commandName}`);
        console.error(error);
    }
}

async function runCommand(interaction) {
    try {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        const key = interaction.guildId;
        let server = new Server(key)
        await server.load();
        if (!server || !server.name) {
            const db = new Database();
            server = { id: interaction.guildId, name: interaction.guild.name, hasAccepted: 0, isBanned: 0 };
            await db.set('servers', server);
        }
        logInteraction = `**Command**: ${interaction.commandName} | **Server**: ${server.name} - ${server.id} | **User**: ${interaction.user.username} - ${interaction.user.id} ||`
        interaction.logInteraction = logInteraction;
        
        interaction.logMessage = await logger.log(logInteraction);

        if (server.isBanned && interaction.commandName !== "help") {
            logger.editLog(interaction.logMessage.id, `${logInteraction} Interaction aborted: Server is Banned`);
            interaction.reply('Your Community has been banned for violating the bot\'s Terms of Use');
            return;
        }

        if (shouldExecute(interaction, command, server)) {
            logger.editLog(interaction.logMessage.id, `${logInteraction} Executing Command`);
            await command.execute(interaction);
        }
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
        interaction.reply("Woops! Brain Fart! Try another Command while I work out what went Wrong :thinking:");
        logger.error(`New Brain Fart occurred!\nCommand: ${interaction.commandName}\nError: ${error.message}`);
    }
}
/**
 * 
 * @param {Interaction} interaction 
 * @param {*} command 
 * @param {Server} server 
 * @returns 
 */
function shouldExecute(interaction, command, server) {

    if (command.premium) {
        if (!server.is_entitled) {
            logger.log(`${logInteraction} || Interaction Aborted: Not Entitled to Premium Commands`);
            interaction.reply("This is a premium command. Premium is not quite ready yet, But I'm working hard to make these commands available for everyone :)")
            //interaction.sendPremiumRequired();
            return false;
        }
    }

    // Ensure server setup for commands that do not ignore setup requirements
    if (!command.ignoreSetup) {
        if (!server || !server.hasAccepted) {
            logger.log(`${logInteraction} || Interaction Aborted: Not Set Up`);
            interaction.reply("A community Administrator must first run the /setup command to completion before you can use me.");
            return false;
        }
    }

    // Check NSFW requirement for commands that specify it
    if (command.nsfw && !interaction.channel.nsfw) {
        logger.log(`${logInteraction} || Interaction Aborted: Channel was not Gated`);
        interaction.reply("My commands can only be used on channels marked as NSFW (`Age Restricted`).\nFor more information use `/help`.");
        return false;
    }

    // Check for Administrator role for commands that require it
    if (command.administrator && !interaction.member.permissions.has("Administrator")) {
        logger.log(`${logInteraction} || Interaction Aborted: User was not Administrator`);
        interaction.reply("You need the Administrator role to use this command.");
        return false;
    }

    // Set server name if not already set and if there's a valid server object
    if (server && ((server.name === undefined || server.name === null) || server.name !== interaction.guild.name)) {
        server.name = interaction.guild.name;
        server.save();
    }

    return true; // If none of the conditions fail, allow the command to execute
}

function isMaintenance() {
    const maintenance_mode = my.maintenance_mode;
    return maintenance_mode;
}
/**
 * 
 * @param {Interaction} interaction
 * @returns bool - True if the server was automatically banned 
 */
async function registerServer(interaction) {

    if (!interaction.guild) return -1; //turns out this means the command is being performed in DM 👀

    const server = new Server(interaction.guildId);
    const user = new User(interaction.guild.ownerId); //server owner
    await user.get();
    await server.load();

    if (!server._loaded) {
        logger.error("Registering server during interaction!");
        let name = "UNKNOWN SERVER NAME - THIS IS A BUG"
        if (interaction.guild) {
            name = interaction.guild.name;
            server.name = name;
            server.owner = interaction.guild.ownerId;
        }

        await server.save();
    } else {
        //ensure the server details are up to date
        if (server.name !== interaction.guild.name || server.owner !== interaction.guild.ownerId) {
            server.name = interaction.guild.name;
            server.owner = interaction.guild.ownerId;
            await server.save();
        }
            
    }

    if (!server.isBanned) {
        if (user.isBanned) {
            new BanHandler().banServer(interaction.guild.id, "Server owner has been banned", interaction, true, true);
            return 1;
        }
    }

    if (!server.message_id) logger.newServer(server);

    return 0;
}

async function registerServerUser(interaction) {

    let user = new User(interaction.user.id, interaction.user.username);

    didLoad = await user.load();
    if (!didLoad) await user.save()
    await user.loadServerUser(interaction.guildId);

    if (!user._serverUserLoaded) await user.saveServerUser();

    return user;
}

/**
 * @deprecated This should be breaking shit
 * @param {Interaction} interaction 
 * @returns 
 */
function hasPermission(interaction) {

    const botPermissions = interaction.guild.members.me.permissionsIn(interaction.channel);

    if (!botPermissions.has('ViewChannel')) {
        interaction.reply('I do not have permission to view this channel. I require permission to `view channel` to function correctly');
        logger.log("Interaction cancelled: Could not access channel");
        return false;
    }

    if (!botPermissions.has('SendMessages')) {
        logger.log("Interaction cancelled: Unable to send messages");
        interaction.reply('I do not have permission to send messages in this channel. I require permission to `send messages` and `embed links` to function correctly');
        return false;
    }

    if (!botPermissions.has('EmbedLinks')) {
        logger.log("Interaction cancelled: Unable to embed messages");
        interaction.reply('I do not have permission to embed links in this channel. I require permission to `send messages` and `embed links` to function correctly');
        return false;
    }

    return true;
}
