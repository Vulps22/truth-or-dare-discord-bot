// leaderboard.test.js

const leaderboardCommand = require('commands/global/leaderboard');
const Server = require('objects/server');
const Leaderboard = require('objects/leaderboard');
const logger = require('objects/logger');


const { Interaction } = require('discord.js');

jest.mock('handlers/userHandler');
jest.mock('objects/server');
jest.mock('objects/logger');
jest.mock('objects/leaderboard');

const generateLeaderboardMock = jest.fn().mockResolvedValue('card-file');
const serverLoadMock = jest.fn().mockResolvedValue();
const hasPremiumMockTrue = jest.fn().mockResolvedValue(true);
const hasPremiumMockFalse = jest.fn().mockResolvedValue(false);


// Mock the logger
logger.error = jest.fn();


describe('leaderboard command', () => {
    let interaction;


    beforeEach(() => {
        interaction = {
            options: {
                getSubcommand: jest.fn(),
            },
            reply: jest.fn(),
            deferReply: jest.fn(),
            editReply: jest.fn(),
            guildId: 'test-guild-id',
            client: {},
        };

        generateLeaderboardMock.mockClear();
        serverLoadMock.mockClear();
        hasPremiumMockFalse.mockClear();
        hasPremiumMockTrue.mockClear();
        interaction.reply.mockClear();
        interaction.deferReply.mockClear();
        interaction.editReply.mockClear();
        interaction.options.getSubcommand.mockClear();
        logger.error.mockClear();
    });



    test('should handle global subcommand', async () => {

        Leaderboard.mockImplementation(() => {
            return {
                generateLeaderboard: generateLeaderboardMock,
            }
        })

        interaction.options.getSubcommand.mockReturnValue('global');

        await leaderboardCommand.execute(interaction);

        expect(interaction.deferReply).toHaveBeenCalled();
        expect(generateLeaderboardMock).toHaveBeenCalledWith(true);
        expect(interaction.editReply).toHaveBeenCalledWith({ files: ['card-file'] });
    });



    test('should handle server subcommand when server has premium', async () => {
        interaction.options.getSubcommand.mockReturnValue('server');

        // Mock the Server class
        Server.mockImplementation(() => {
            return {
                load: jest.fn().mockResolvedValue({
                    hasPremium: hasPremiumMockTrue, // Mock hasPremium method
                }),
            };
        });

        Leaderboard.mockImplementation(() => {
            return {
                generateLeaderboard: generateLeaderboardMock,
            }
        })


        // Proceed with your test
        await leaderboardCommand.execute(interaction);

        // Assertions
        expect(Server).toHaveBeenCalledWith(interaction.guildId);
        expect(hasPremiumMockTrue).toHaveBeenCalled();
        expect(interaction.deferReply).toHaveBeenCalled();
        expect(generateLeaderboardMock).toHaveBeenCalledWith(false);
        expect(interaction.editReply).toHaveBeenCalledWith({ files: ['card-file'] });
    });

    test('should handle server subcommand when server does not have premium', async () => {
        interaction.options.getSubcommand.mockReturnValue('server');

        // Mock the Server class
        Server.mockImplementation(() => {
            return {
                load: jest.fn().mockResolvedValue({
                    hasPremium: hasPremiumMockFalse, // Mock hasPremium method
                }),
            };
        });

        Leaderboard.mockImplementation(() => {
            return {
                generateLeaderboard: generateLeaderboardMock,
            }
        })


        // Proceed with your test
        await leaderboardCommand.execute(interaction);

        // Assertions
        expect(Server).toHaveBeenCalledWith(interaction.guildId);
        expect(hasPremiumMockFalse).toHaveBeenCalled();
        expect(interaction.deferReply).toHaveBeenCalled();
        expect(generateLeaderboardMock).not.toHaveBeenCalledWith(false);
        expect(interaction.editReply).toHaveBeenCalledWith(expect.objectContaining({ content: "This is a premium command. Premium is not quite ready yet, But I'm working hard to make these commands available for everyone :)" }));
    });

    test('should log error when server is undefined', async () => {
        interaction.options.getSubcommand.mockReturnValue('server');
        const undefinedServerMock = jest.fn().mockResolvedValue(undefined);

        Server.mockImplementation(() => {
            return {
                load: undefinedServerMock,
            };
        });

        await leaderboardCommand.execute(interaction);

        expect(undefinedServerMock).toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith("Server was undefined while handling premium checks");
    });
});
