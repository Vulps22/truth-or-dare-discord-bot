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

    beforeAll(() => {
         // Mock console.log
         jest.spyOn(console, 'log').mockImplementation(() => {});
    });

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
            user: { id: 'test-user-id' },
            replied: false,
            deferred: false
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

    afterAll(() => {
        console.log.mockRestore();
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

    test('should log warning when execution time exceeds threshold', async () => {
        // Mock Date.now to control execution time
        const originalNow = Date.now;
        const mockNow = jest.fn()
            .mockReturnValueOnce(1000)      // Start time
            .mockReturnValueOnce(7000);     // End time (6 seconds later)
        Date.now = mockNow;

        interaction.options.getSubcommand.mockReturnValue('global');
        
        Leaderboard.mockImplementation(() => ({
            generateLeaderboard: jest.fn().mockResolvedValue('card-file')
        }));

        await leaderboardCommand.execute(interaction);

        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Leaderboard generation exceeded 5000ms threshold!'));
        
        // Restore original Date.now
        Date.now = originalNow;
    });

    test('should handle errors and log execution time', async () => {
        // Mock Date.now to control execution time
        const originalNow = Date.now;
        const mockNow = jest.fn()
            .mockReturnValueOnce(1000)      // Start time
            .mockReturnValueOnce(3000);     // End time (2 seconds later)
        Date.now = mockNow;

        interaction.options.getSubcommand.mockReturnValue('global');
        interaction.replied = false;
        interaction.deferred = false;

        const testError = new Error('Test error');
        Leaderboard.mockImplementation(() => ({
            generateLeaderboard: jest.fn().mockRejectedValue(testError)
        }));

        await leaderboardCommand.execute(interaction);

        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('Leaderboard command failed after 2000ms')
        );
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('Error: Error: Test error')
        );

        // Restore original Date.now
        Date.now = originalNow;
    });

    test('should handle all error response scenarios', async () => {
        const testCases = [
            { replied: false, deferred: false, expectReply: true, expectEditReply: false },
            { replied: false, deferred: true, expectReply: false, expectEditReply: true },
            { replied: true, deferred: true, expectReply: false, expectEditReply: false }
        ];

        for (const testCase of testCases) {
            // Reset mocks
            interaction.reply.mockClear();
            interaction.editReply.mockClear();

            // Setup test case
            interaction.replied = testCase.replied;
            interaction.deferred = testCase.deferred;
            
            Leaderboard.mockImplementation(() => ({
                generateLeaderboard: jest.fn().mockRejectedValue(new Error('Test error'))
            }));

            await leaderboardCommand.execute(interaction);

            if (testCase.expectReply) {
                expect(interaction.reply).toHaveBeenCalledWith({
                    content: 'An error occurred while generating the leaderboard.',
                    ephemeral: true
                });
            } else {
                expect(interaction.reply).not.toHaveBeenCalled();
            }

            if (testCase.expectEditReply) {
                expect(interaction.editReply).toHaveBeenCalledWith({
                    content: 'An error occurred while generating the leaderboard.'
                });
            } else if (!testCase.replied) {
                expect(interaction.editReply).not.toHaveBeenCalled();
            }
        }
    });
});
