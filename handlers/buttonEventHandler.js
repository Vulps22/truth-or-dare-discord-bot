const { Interaction, Message, InteractionResponse, ButtonStyle, MessageFlags } = require("discord.js");
const logger = require("objects/logger");
const SetupHandler = require("handlers/setupHandler");
const ServerHandler = require("handlers/serverHandler");
const Dare = require("objects/dare");
const User = require("objects/user");
const Truth = require("objects/truth");
const Server = require("objects/server");
const UserHandler = require("handlers/userHandler");
const GivenQuestion = require("objects/givenQuestion");
const Handler = require("./handler");
const { ButtonBuilder, ActionRowBuilder } = require("node_modules/@discordjs/builders/dist");
const Database = require("objects/database");

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
        await this.interaction.deferReply({ ephemeral: true });
        // The target date: 5th September 2024 at 05:11 AM (UK time)
        const targetDate = new Date('2024-09-05T05:11:00Z'); // UTC date format

        // Message creation date
        const messageTimestamp = this.interaction.message.createdAt;


        // Check if the message was created before the target date
        if (messageTimestamp < targetDate) {
            logger.editLog(this.interaction.logMessage, `${this.interaction.logInteraction} Button Interaction Aborted: Incompatible Versions (message too old)`);
            this.interaction.message.edit({
                content: this.interaction.message.content, // Keep the same content
                embeds: this.interaction.message.embeds, // Keep the same embeds
                components: [] // Remove the components (e.g., buttons, dropdowns, etc.)
            });
            this.interaction.reply("A recent Update has changed how I identify bots. I am unable to register any votes on messages created before <t:1725855060:F>")
        }

        //get the type from the question using the messageId as the key
        const db = new Database();

        let type = await db.query(`SELECT * from user_questions WHERE messageId = '${this.interaction.message.id}'`);
        console.log(type);
        if (type == []) {
            console.log("No user question found, checking questions table");
            type = type[0].type;
        }

        let buttonId = this.interaction.customId;
        /** @type {Array<string>} */
        let idComponents = buttonId.split('_')
        let commandName = idComponents[0];

        console.log(idComponents);
        console.log(commandName);

        switch (commandName) {
            case 'truth': //TODO: Remove this in a future update -- It is here to support old buttons
            case 'dare': //TODO: Remove this in a future update - -It is here to support old buttons
            case 'question':
                await new Handler(type).vote(this.interaction);
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
            case 'given':
                handleGivenQuestion(this.interaction, idComponents);
                break;
            case 'rules': {
                let user = new User(this.interaction.user.id);
                await user.get();
                user.rulesAccepted = true;
                await user.save();
                this.interaction.editReply('Rules Accepted.')
                logger.editLog(this.interaction.logMessage, `${this.interaction.logInteraction} User has Accepted the Rules and can now create new Truths or Dares`);
                break;
            }
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
            setupHandler.action_1(interaction);
            break;
    }
}
/**
 * 
 * @param {Interaction} interaction 
 * @param {Array<string>} idComponents 
 */
async function handleContentResponse(interaction, idComponents) {
    if (!interaction.deferred) interaction.deferReply({ ephemeral: true })
    const type = idComponents[1];
    const decision = idComponents[2];

    switch (type) {
        case "dare":
        case "truth":
        case "question":
            new Handler('question').setQuestion(interaction, decision);
            break;
        case "server":
            new ServerHandler(interaction.client).banServer(interaction, decision)

    }
}

/**
 * 
 * @param {Interaction} interaction 
 * @param {Array<string>} idComponents 
 */
async function handleUserModerationCommand(interaction, idComponents) {
    const type = idComponents[1];
    let entity;

    switch (type) {
        case 'dare':
            entity = await new Dare().find(interaction.message.id);
            break;
        case 'truth':
            entity = await new Truth().find(interaction.message.id);
            break;
        case 'server':
            entity = await new Server().find(interaction.message.id);
            break;
        default:
            throw new Error("Undefined user moderation type");
    }

    await entity.load();
    /** TODO: Replace entity.owner with entity.creator */
    const owner = new User(entity.creator ?? entity.owner);
    console.log('server', entity);
    console.log('owner', owner);
    await owner.get();
    await new UserHandler().banUser(interaction, owner);
}


/**
 * 
 * @param {Interaction} interaction 
 * @param {Array<string>} idComponents 
 */
async function handleGivenQuestion(interaction, idComponents) {
    /** @type {GivenQuestion} */
    const given = await GivenQuestion.find(interaction.message.id);
    if (!given) {
        return interaction.reply({ content: "This question could not be found.", ephemeral: true });
    }


    const target = new User(given.targetId);
    await target.get();
    await target.loadServerUser(interaction.guildId);

    if (interaction.user.id == given.targetId && idComponents[1] !== 'skip') {
        interaction.reply({ content: `You can't vote on your own ${given.type}!`, ephemeral: true })
        return;
    }

    switch (idComponents[1]) {
        case 'done':
            await given.incrementDone();
            break;
        case 'failed':
            await given.incrementFail();
            break;
        case 'skip':
            if (interaction.user.id !== given.targetId) {
                interaction.reply({ content: `You can't skip someone else's ${given.type}!`, ephemeral: true });
                return;
            }

            if (target.hasValidVote()) {
                await target.burnVote();
                await given.skip();
            } else {
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Vote on Top.gg')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://top.gg/bot/1079207025315164331/vote'),
                    new ButtonBuilder()
                        .setLabel('Buy 10')
                        .setStyle(ButtonStyle.Premium)
                        .setURL(`https://discord.com/application-directory/${my.client}/store/1335708253165719572`)
                );
                interaction.reply(
                    {
                        content: "Uh oh! You're out of Skips!\nNot to worry, You can earn up to 10 skips by voting for the bot every day on [top.gg](https://top.gg/bot/1079207025315164331/vote)!",
                        components: [row],
                        flags: MessageFlags.Ephemeral
                    });
                return;
            }
            break;
    }
    const newEmbed = given.createEmbed();

    interaction.message.edit({ embeds: [newEmbed.embed], components: [newEmbed.row] })
    if (idComponents[1] !== 'skip') interaction.editReply({ content: "Your vote has been registered", ephemeral: true });
    else interaction.reply({ content: `Your ${given.type} has been skipped! You have ${target.voteCount} skips remaining!`, ephemeral: true })

    if (given.doneCount >= my.required_votes) {

        const xpType = given.xpType;

        const sender = new User(given.senderId);
        await sender.get();
        await sender.loadServerUser(interaction.guildId);

        switch (xpType) {
            case 'server':
                await sender.subtractServerXP(given.wager);
                await target.addServerXP(given.wager);
                break;
            case 'global':
                await sender.subtractXP(given.wager);
                await target.addXP(given.wager);
                break;
        }
    }
}