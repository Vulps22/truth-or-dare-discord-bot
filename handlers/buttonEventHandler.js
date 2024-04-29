const { Interaction } = require("discord.js");
const DareHandler = require("./dareHandler");
const TruthHandler = require("./truthHandler");
const BanHandler = require("./banHandler");

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

  async execute(){
    let buttonId = this.interaction.customId;
    let idComponents = buttonId.split('_')
    let commandName = idComponents[0];
    switch (commandName) {
        case "dare":
            await new DareHandler(this.interaction.client).vote(this.interaction);
            break;
        case "truth":
            await new TruthHandler(this.interaction.client).vote(this.interaction);
            break;
        case "setup":
            handleSetupButton(this.interaction, idComponents[1]);
            break;
        case 'new':
            handleContentResponse(this.interaction, idComponents);
            break;
        default:
            const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_FARTS_URL });
            webhookClient.send(`**Failed to find Button Command** | **server**: ${interaction.guild.name} \n\n**Button ID**: ${buttonId}`);
            interaction.reply("Woops! Brain Fart! Try another Command while I work out what went Wrong :thinking:");
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
    }
}