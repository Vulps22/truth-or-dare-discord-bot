const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Dare = require('objects/dare');
const Truth = require('objects/truth');
const Server = require('objects/server');
const moduleToTest = require('objects/logger'); // Adjust this to the actual module name
const getChannelMock = jest.fn();
const { applyGlobals } = require("tests/setuptest.js")


jest.mock('discord.js', () => {
    const actualDiscord = jest.requireActual('discord.js');
    return {
        ...actualDiscord,

    };
});

jest.mock('objects/dare.js');
jest.mock('objects/truth.js');
jest.mock('objects/server.js');

global.client = {
    channels: {
        cache: {
            get: getChannelMock
        }
    }
};

describe('Module Tests', () => {
    beforeEach(() => {
        applyGlobals();
        jest.clearAllMocks();

        console.log = jest.fn();
        console.error = jest.fn();


        /** @type {Config} */
        global.my = {
            maintenance_mode: false,
            token: null,
            logs: 'log_test',
            dares_log: 'dares_log_test',
            truths_log: 'truths_log_test',
            servers_log: 'servers_log_test',
            errors_log: 'errors_log_test',
            required_votes: 3,
            environment: 'stage'
        };
    });

    test('log should send a message to the logs channel', async () => {
        const sendMock = jest.fn();
        getChannelMock.mockReturnValue({ send: sendMock });

        await moduleToTest.log('Test message');

        expect(getChannelMock).toHaveBeenCalledWith('log_test'); // Adjust this if `my.logs` needs to be a variable
        expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ content: 'Test message' }));
        expect(console.log).toHaveBeenCalledWith('Test message');
    });

    test('error should send an error message to the errors_log channel and log the error', async () => {
        const sendMock = jest.fn();
        getChannelMock.mockReturnValue({ send: sendMock });

        await moduleToTest.error('Test error message');

        expect(getChannelMock).toHaveBeenCalledWith('errors_log_test'); // Adjust this if `my.errors_log` needs to be a variable
        expect(sendMock).toHaveBeenCalledWith({
            embeds: [expect.objectContaining({
                setTitle: expect.any(Function),
                setDescription: expect.any(Function),
                addFields: expect.any(Function),
                setFooter: expect.any(Function),
            })]
        });
        expect(console.error).toHaveBeenCalledWith('Test error message');
        expect(console.log).toHaveBeenCalledWith('Test error message');
    });

    test('newDare should send a new dare message and save the dare', async () => {
        const sendMock = jest.fn().mockResolvedValue({ id: '12345' });
        getChannelMock.mockReturnValue({ send: sendMock });

        const dareMock = new Dare();
        dareMock.getCreatorUsername = jest.fn().mockResolvedValue('testuser');
        dareMock.save = jest.fn();
        dareMock.question = "Sample Dare";
        dareMock.creator = "CreatorID";
        dareMock.banReason = "No reason";
        dareMock.id = 1;
        dareMock.server = { name: "Sample Server" };

        await moduleToTest.newDare(dareMock);

        expect(sendMock).toHaveBeenCalledWith({
            embeds: [expect.objectContaining({
                data: expect.objectContaining({
                    title: "New Dare",
                    fields: expect.arrayContaining([
                        expect.objectContaining({ name: "Dare", value: "Sample Dare" }),
                        expect.objectContaining({ name: "Author", value: "testuser | CreatorID" }),
                        expect.objectContaining({ name: "Server:", value: "Sample Server" }),
                        expect.objectContaining({ name: "Ban Reason:", value: "No reason" })
                    ]),
                    footer: expect.objectContaining({
                        text: "ID: #1"
                    })
                })
            })],
            components: [expect.any(Object)],
            fetchReply: true
        });
        expect(dareMock.messageId).toBe('12345');
        expect(dareMock.save).toHaveBeenCalled();
    });


    //TODO: FINISH THIS BY CHECKING THE CONTENT SENT TO DISCORD
    test('updateDare should update an existing dare message', async () => {
        const editMock = jest.fn().mockImplementation((messageId, data) => {
            console.log('message.edit called with:', { messageId, data });
            return Promise.resolve({ id: messageId });
        });

        const channelMock = {
            messages: {
                edit: editMock
            }
        };

        // Log when getChannelMock is called
        getChannelMock.mockReturnValue(channelMock);
        console.log('getChannelMock was called and returned:', channelMock);

        const dareMock = new Dare();
        dareMock.messageId = '12345';
        dareMock.getCreatorUsername = jest.fn().mockResolvedValue('testuser');

        // Call the function under test
        await moduleToTest.updateDare(dareMock);

        // Verify that the correct data was passed to message.edit
        expect(editMock).toHaveBeenCalledWith('12345', expect.any(Object)); // Can be refined further based on output
    });


    // Add similar tests for newTruth, updateTruth, newServer, updateServer, and deleteServer

});