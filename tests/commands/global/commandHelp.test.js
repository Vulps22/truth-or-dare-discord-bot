const { Client, Intents, GatewayIntentBits } = require('discord.js');
const sinon = require('sinon');
const helpCommand = require('commands/global/help'); // Adjust the path to your help command file
const embedder = require('embedder');
const Database = require('objects/database');

jest.mock('objects/database');

describe('/help command', () => {
    let client;
    let interaction;

    beforeEach(() => {
        client = new Client({ intents: [GatewayIntentBits.Guilds] });

        interaction = {
            guildId: 'testGuildId',
            reply: sinon.spy(),
        };
    });

    test('should reply with the help embed without setup info when setup is complete', async () => {

        Database.mockImplementation(() => {
            return {
                get: sinon.stub().returns({ hasAccepted: true }), // Mocking database response
            };
        });

        await helpCommand.execute(interaction);
        const replyArgs = interaction.reply.getCall(0).args[0];

        expect(replyArgs.embeds.length).toBe(1);

        const embedData = replyArgs.embeds[0].data;

        expect(embedData.title).toBe('Truth or Dare Bot Help');
        expect(embedData.description).toBe('Here are the commands you can use with the bot:');
        expect(embedData.fields.length).toBe(10); // No fields for non-setup
    });

    test('should reply with the setup embed if not setup', async () => {
        // Changing the mock to return true for setup
        Database.mockImplementation(() => {
            return {
                get: sinon.stub().returns({ hasAccepted: 0 }),
            };
        });

        await helpCommand.execute(interaction);
        const replyArgs = interaction.reply.getCall(0).args[0];

        expect(replyArgs.embeds.length).toBe(1);

        const embedData = replyArgs.embeds[0].data;

        expect(embedData.title).toBe('Truth or Dare Bot Help');
        expect(embedData.description).toBe('Here are the commands you can use with the bot:');
        expect(embedData.fields.length).toBe(11); // Fields should be present for setup

        console.log(embedData.fields);

        // Check that the setup text is included
        const setupField = embedData.fields.find(field => field.name === 'Getting Started');
        expect(setupField).toBeDefined();
        expect(setupField.value).toBe('You must first read and accept our Terms of Use before using the bot');
    });
});
