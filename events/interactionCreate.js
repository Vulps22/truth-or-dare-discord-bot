const { Events, WebhookClient, Interaction } = require("discord.js");
const UserHandler = require("../handlers/userHandler");
const Database = require("../objects/database");
const DareHandler = require("../handlers/dareHandler");
const TruthHandler = require("../handlers/truthHandler");
const Server = require("../objects/server");
const User = require("../objects/user");
const SetupHandler = require("../handlers/setupHandler");

module.exports = {
    name: Events.InteractionCreate,
    /**
     * 
     * @param {Interaction} interaction 
     * @returns 
     */
    async execute(interaction) {

        await registerServerUser(interaction);

        if (interaction.isAutocomplete()) {
            await handleAutoComplete(interaction);
            return;
        }

        if (interaction.isButton()) {
            await handleButton(interaction);
        }

        let user;
        try {
            user = await new UserHandler().getUser(interaction.user.id, interaction.user.username);
        } catch (error) {
            console.error('Error getting user:', error);
            return;
        }

        if (!user) {
            const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_FARTS_URL });
            webhookClient.send(`**Failed to create User during InteractionCreate** | **server**: ${interaction.guild.name}`);
        }

        if (interaction.isChatInputCommand()) {
            await log(interaction);
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

async function handleButton(interaction) {
    let buttonId = interaction.customId;
    let idComponents = buttonId.split('_')
    let commandName = idComponents[0];
    switch (commandName) {
        case "dare":
            await new DareHandler(interaction.client).vote(interaction);
            break;
        case "truth":
            await new TruthHandler(interaction.client).vote(interaction);
            break;
        case "setup":
            handleSetupButton(interaction, idComponents[1]);
            break;
        default:
            const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_FARTS_URL });
            webhookClient.send(`**Failed to find Button Command** | **server**: ${interaction.guild.name} \n\n**Button ID**: ${buttonId}`);
            interaction.reply("Woops! Brain Fart! Try another Command while I work out what went Wrong :thinking:");
    }
}

async function log(interaction) {
    if (interaction.guild === null) {
        const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_FARTS_URL });
        webhookClient.send(`**Null Server**: ${interaction.commandName} | **server**: INTERACTION.GUILD WAS NULL OR UNDEFINED`);
    }

    let serverName = interaction.guild.name;
    const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_COMMAND_URL });
    webhookClient.send(`**Command**: ${interaction.commandName} | **server**: ${serverName ? serverName : "UNKNOWN SERVER NAME"}`);
}

function hasPermission(interaction) {
    const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_COMMAND_URL });

    const botPermissions = interaction.guild.members.me.permissionsIn(interaction.channel);

    if (!botPermissions.has('ViewChannel')) {
        interaction.reply('I do not have permission to view this channel. I require permission to `view channel` to function correctly');
        webhookClient.send(`Interaction Failed: No Permissions`);
        return false;
    }

    if (!botPermissions.has('SendMessages')) {
        interaction.reply('I do not have permission to send messages in this channel. I require permission to `send messages` and `embed links` to function correctly');
        webhookClient.send(`Interaction Failed: No Permissions`);
        return false;
    }

    if (!botPermissions.has('EmbedLinks')) {
        interaction.reply('I do not have permission to embed links in this channel. I require permission to `send messages` and `embed links` to function correctly');
        webhookClient.send(`Interaction Failed: No Permissions`);
        return false;
    }

    return true;
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

        if (server.isBanned && interaction.commandName !== "help") {

            interaction.reply('Your Community has been banned for violating the bot\'s Terms of Use');
            const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_COMMAND_URL });
            webhookClient.send(`Command Aborted: **Banned** | **server**: ${interaction.guild.name}`);
            return;
        }

        if (shouldExecute(interaction, command, server)) await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
        interaction.reply("Woops! Brain Fart! Try another Command while I work out what went Wrong :thinking:");
        const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_FARTS_URL });
        webhookClient.send(`New Brain Fart occurred!\nCommand: ${interaction.commandName}\nError: ${error.message}`);
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
            interaction.sendPremiumRequired();
            return false;
        }
    }

    // Ensure server setup for commands that do not ignore setup requirements
    if (!command.ignoreSetup) {
        if (!server || !server.hasAccepted) {
            interaction.reply("A community Administrator must first run the /setup command before you can use me.");
            return false;
        }
    }

    // Check NSFW requirement for commands that specify it
    if (command.nsfw && !interaction.channel.nsfw) {
        interaction.reply("My commands can only be used on channels marked as NSFW (`Age Restricted`).\nFor more information use `/help`.");
        return false;
    }

    // Check for Administrator role for commands that require it
    if (command.administrator && !interaction.member.permissions.has("Administrator")) {
        interaction.reply("You need the Administrator role to use this command.");
        return false;
    }

    // Set server name if not already set and if there's a valid server object
    if (server && ((server.name === undefined || server.name === null) || server.name !== interaction.guild.name)) {
        server.name = interaction.guild.name;
    }

    // Always update the server in the database to track active servers
    const db = new Database();
    db.set('servers', server);

    return true; // If none of the conditions fail, allow the command to execute
}

async function registerServerUser(interaction) {
    let user = new User(interaction.user.id, interaction.user.username);

    didLoad = await user.load();
    if (!didLoad) await user.save()
    await user.loadServerUser(interaction.guildId);

    if (!user.serverUserLoaded) await user.saveServerUser()
    return user;
}

function hasPermission(interaction) {
    const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_COMMAND_URL });

    const botPermissions = interaction.guild.members.me.permissionsIn(interaction.channel);

    if (!botPermissions.has('ViewChannel')) {
        interaction.reply('I do not have permission to view this channel. I require permission to `view channel` to function correctly');
        webhookClient.send(`Interaction Failed: No Permissions`);
        return false;
    }

    if (!botPermissions.has('SendMessages')) {
        interaction.reply('I do not have permission to send messages in this channel. I require permission to `send messages` and `embed links` to function correctly');
        webhookClient.send(`Interaction Failed: No Permissions`);
        return false;
    }

    if (!botPermissions.has('EmbedLinks')) {
        interaction.reply('I do not have permission to embed links in this channel. I require permission to `send messages` and `embed links` to function correctly');
        webhookClient.send(`Interaction Failed: No Permissions`);
        return false;
    }

    return true;
}

function handleSetupButton(interaction, step) {
    const setupHandler = new SetupHandler();
    console.log(step)
    switch (step) {
        case "1":
            console.log('step 1')
            setupHandler.action_1(interaction);
            break;
    }
}