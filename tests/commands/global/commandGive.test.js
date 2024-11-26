const command = require('commands/global/give'); // adjust the path
const TruthHandler = require('handlers/truthHandler');
const DareHandler = require('handlers/dareHandler');
const User = require('objects/user');
const Server = require('objects/server');

jest.mock('handlers/truthHandler');
jest.mock('handlers/dareHandler');
jest.mock('objects/user');
jest.mock('objects/server');

describe('Give Command', () => {
    let interaction;

    beforeEach(() => {
        interaction = {
            options: {
                getSubcommand: jest.fn(),
                getString: jest.fn(),
                getInteger: jest.fn()
            },
            user: { id: '123' },
            client: {},
            guildId: 'guild123',
            reply: jest.fn(),
            deferReply: jest.fn(),
            editReply: jest.fn(),
        };

        User.mockClear();
        Server.mockClear();
        TruthHandler.mockClear();
        DareHandler.mockClear();
    });

    test('should defer reply', async () => {
        await command.execute(interaction);

        expect(interaction.deferReply).toHaveBeenCalledWith({ ephemeral: true });
    });

    test('should defer reply when not already deferred', async () => {
        interaction.deferred = false;  // Explicitly set to false
        await command.execute(interaction);
        expect(interaction.deferReply).toHaveBeenCalledWith({ ephemeral: true });
    });

    test('should skip deferring reply when already deferred', async () => {
        interaction.deferred = true;  // Explicitly set to true
        await command.execute(interaction);
        expect(interaction.deferReply).not.toHaveBeenCalled();
    });

    test('should execute truth subcommand successfully', async () => {
        // Set up mock interaction options
        interaction.options.getSubcommand.mockReturnValue('truth');
        interaction.options.getString.mockReturnValue('global');
        interaction.options.getInteger.mockReturnValue(100);

        // Set up mock user behavior
        const userInstance = {
            get: jest.fn(),
            getTotalGlobalXP: jest.fn().mockReturnValue(200), // enough XP
        };
        User.mockImplementation(() => userInstance);

        const truthHandlerInstance = { giveTruth: jest.fn() };
        TruthHandler.mockImplementation(() => truthHandlerInstance);

        await command.execute(interaction);

        expect(TruthHandler).toHaveBeenCalledWith(interaction.client);
        expect(truthHandlerInstance.giveTruth).toHaveBeenCalledWith(interaction);
        expect(interaction.editReply).not.toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('You do not have'),
        }));
    });

    test('should execute dare subcommand successfully', async () => {
        interaction.options.getSubcommand.mockReturnValue('dare');
        interaction.options.getString.mockReturnValue('global');
        interaction.options.getInteger.mockReturnValue(100);

        const userInstance = {
            get: jest.fn(),
            getTotalGlobalXP: jest.fn().mockReturnValue(200), // enough XP
        };
        User.mockImplementation(() => userInstance);

        const dareHandlerInstance = { giveDare: jest.fn() };
        DareHandler.mockImplementation(() => dareHandlerInstance);

        await command.execute(interaction);

        expect(DareHandler).toHaveBeenCalledWith(interaction.client);
        expect(dareHandlerInstance.giveDare).toHaveBeenCalledWith(interaction);
        expect(interaction.editReply).not.toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('You do not have'),
        }));
    });

    test('should return error if not enough global XP', async () => {
        interaction.options.getSubcommand.mockReturnValue('dare');
        interaction.options.getString.mockReturnValue('global');
        interaction.options.getInteger.mockReturnValue(100);

        const userInstance = {
            get: jest.fn(),
            getTotalGlobalXP: jest.fn().mockReturnValue(50), // not enough XP
        };
        User.mockImplementation(() => userInstance);

        await command.execute(interaction);

        expect(interaction.editReply).toHaveBeenCalledWith({
            content: 'You do not have 100 global XP to wager',
            ephemeral: true,
        });
        expect(DareHandler).not.toHaveBeenCalled();
    });

    test('should return error if server does not have premium for server XP', async () => {
        interaction.options.getSubcommand.mockReturnValue('truth');
        interaction.options.getString.mockReturnValue('server');
        interaction.options.getInteger.mockReturnValue(100);

        const userInstance = {
            get: jest.fn(),
            getTotalServerXP: jest.fn().mockReturnValue(200),
        };
        User.mockImplementation(() => userInstance);

        const serverInstance = {
            load: jest.fn(),
            hasPremium: jest.fn().mockResolvedValue(false),
        };
        Server.mockImplementation(() => serverInstance);

        await command.execute(interaction);

        expect(interaction.editReply).toHaveBeenCalledWith({
            content: expect.stringContaining('Wagering Server XP is a premium feature'),
            ephemeral: true,
        });
        expect(TruthHandler).not.toHaveBeenCalled();
    });

    test('should return error if not enough server XP', async () => {
        interaction.options.getSubcommand.mockReturnValue('truth');
        interaction.options.getString.mockReturnValue('server');
        interaction.options.getInteger.mockReturnValue(100);

        const userInstance = {
            get: jest.fn(),
            getTotalServerXP: jest.fn().mockReturnValue(50), // not enough XP
        };
        User.mockImplementation(() => userInstance);

        const serverInstance = {
            load: jest.fn(),
            hasPremium: jest.fn().mockResolvedValue(true), // server has premium
        };
        Server.mockImplementation(() => serverInstance);

        await command.execute(interaction);

        expect(interaction.editReply).toHaveBeenCalledWith({
            content: 'You do not have 100 server XP to wager',
            ephemeral: true,
        });
        expect(TruthHandler).not.toHaveBeenCalled();
    });
});

describe('hasEnoughXP function', () => {
    let interaction;

    beforeEach(() => {
        interaction = {
            options: {
                getSubcommand: jest.fn(),
                getString: jest.fn(),
                getInteger: jest.fn()
            },
            user: { id: '123' },
            client: {},
            guildId: 'guild123',
            reply: jest.fn(),
            deferReply: jest.fn(),
            editReply: jest.fn(),
        };

        User.mockClear();
        Server.mockClear();
        TruthHandler.mockClear();
        DareHandler.mockClear();
    });

    test('should handle server XP when user has enough XP', async () => {
        interaction.options.getString.mockReturnValue('server');
        interaction.options.getInteger.mockReturnValue(100);

        const userInstance = {
            get: jest.fn(),
            getTotalServerXP: jest.fn().mockReturnValue(200), // More than wager
        };
        User.mockImplementation(() => userInstance);

        const serverInstance = {
            load: jest.fn(),
            hasPremium: jest.fn().mockResolvedValue(true),
        };
        Server.mockImplementation(() => serverInstance);

        await command.execute(interaction);

        expect(userInstance.getTotalServerXP).toHaveBeenCalled();
        expect(interaction.editReply).not.toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining('You do not have')
            })
        );
    });

    test('should handle server XP when user does not have enough XP', async () => {
        interaction.options.getString.mockReturnValue('server');
        interaction.options.getInteger.mockReturnValue(200);

        const userInstance = {
            get: jest.fn(),
            getTotalServerXP: jest.fn().mockReturnValue(100), // Less than wager
        };
        User.mockImplementation(() => userInstance);

        const serverInstance = {
            load: jest.fn(),
            hasPremium: jest.fn().mockResolvedValue(true),
        };
        Server.mockImplementation(() => serverInstance);

        await command.execute(interaction);

        expect(userInstance.getTotalServerXP).toHaveBeenCalled();
        expect(interaction.editReply).toHaveBeenCalledWith({
            content: 'You do not have 200 server XP to wager',
            ephemeral: true
        });
    });
});
