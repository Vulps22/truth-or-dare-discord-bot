const { Interaction, Message } = require("discord.js");
const DareHandler = require("./dareHandler");
const TruthHandler = require("./truthHandler");
const BanHandler = require("./banHandler");
const logger = require("../objects/logger");
const SetupHandler = require("./setupHandler");
const ServerHandler = require("./serverHandler");
const Dare = require("../objects/dare");
const User = require("../objects/user");
const Truth = require("../objects/truth");
const Server = require("../objects/server");
const UserHandler = require("./userHandler");

class ButtonEventHandler {
    /**
     * 
     * @param {Interaction} interaction 
     */
    constructor(interaction) {
        this.interaction = interaction;
        this.event = interaction.customId;
        this.message = interaction.message
    }

    async execute() {
        let buttonId = this.interaction.customId;
        /** @type {Array<string>} */
        let idComponents = buttonId.split('_')
        let commandName = idComponents[0];

        console.log(idComponents);
        console.log(commandName);

        switch (commandName) {
            case 'dare':
                await new DareHandler(this.interaction.client).vote(this.interaction);
                break;
            case 'truth':
                await new TruthHandler(this.interaction.client).vote(this.interaction);
                break;
            case 'setup':
                handleSetupButton(this.interaction, idComponents[1]);
                break;
            case 'new':
                handleContentResponse(this.interaction, idComponents);
                break;
            case 'user':
                handleUserModerationCommand(this.interaction, idComponents);
                break;
            default:
                await logger.error(`**Failed to find Button Command** | **server**: ${this.interaction.guild.name} \n\n**Button ID**: ${buttonId}`);
                this.interaction.reply("Woops! Brain Fart! Try another Command while I work out what went Wrong :thinking:");
        }
    }
}

module.exports = ButtonEventHandler;

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

function handleContentResponse(interaction, idComponents) {
    const type = idComponents[1];
    const decision = idComponents[2];

    switch (type) {
        case "dare":
            new DareHandler(interaction.client).setDare(interaction, decision);
            break;
        case "truth":
            new TruthHandler(interaction.client).setTruth(interaction, decision);
            break;
        case "server":
            new ServerHandler(interaction.client).banServer(interaction)

    }
}

/**
 * 
 * @param {Interaction} interaction 
 * @param {Array<string>} idComponents 
 */
async function handleUserModerationCommand(interaction, idComponents) {
    const type = idComponents[1];

    /** @type {User} */
    let owner;

    switch(type) {
        case 'dare':
            const dare = await new Dare().find(interaction.message.id);
            await dare.load()
            owner = new User(dare.creator);
            break;
        case 'truth':
            const truth = await new Truth().find(interaction.message.id);
            await truth.load()
            owner = new User(truth.creator);
            break;
        case 'server':
            const server = await new Server().find(interaction.message.id);
            await server.load()
            owner = new User(server.creator);
            break;
        default:
            throw Error("Undefined user moderation type");
    }

    owner.get();

    new UserHandler().banUser(interaction, owner);

}