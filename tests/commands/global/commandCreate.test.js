const { SlashCommandBuilder } = require("discord.js");
const command = require('commands/global/create'); // adjust the path to your file
const DareHandler = require("handlers/dareHandler");
const TruthHandler = require("handlers/truthHandler");
const Database = require("objects/database");
const User = require("objects/user");
const logger = require("objects/logger");
const { applyGlobals } = require("tests/setuptest");

jest.mock("objects/user");
jest.mock("handlers/dareHandler");
jest.mock("handlers/truthHandler");
jest.mock("objects/database", () => {
    return jest.fn().mockImplementation(() => ({
        createdWithin: jest.fn().mockResolvedValue([]) // Create a mock function for canCreate
    }))
});
jest.mock("objects/logger");

const mockGet = jest.fn().mockResolvedValue();
const mockCanCreate = jest.fn().mockResolvedValue(false);

User.mockImplementation(() => ({
    get: mockGet,
    canCreate: mockCanCreate,
}));


describe('Create Truth or Dare Command', () => {
    let interaction;

    beforeEach(() => {
        applyGlobals();
        interaction = {
            options: {
                getSubcommand: jest.fn(),
                getString: jest.fn()
            },
            user: { id: '123', canCreate: jest.fn() },
            client: {},
            reply: jest.fn(),
            deferReply: jest.fn(),
            logMessage: {
                id: 'messageId'
            }
        };

        Database.mockClear();
        DareHandler.mockClear();
        TruthHandler.mockClear();
        User.mockClear();
        logger.error.mockClear();
    });

    test('should abort creation if user has not accepted the rules', async () => {
    
        await command.execute(interaction);
    
        // Assertions
        expect(User).toHaveBeenCalledWith(interaction.user.id);
        expect(mockGet).toHaveBeenCalled();
        expect(mockCanCreate).toHaveBeenCalled();
        expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: "You must accept the rules before creating a Truth or Dare",
        }));
    });
    
    

    test('should execute dare subcommand successfully', async () => {
        interaction.options.getSubcommand.mockReturnValue('dare');
        interaction.options.getString.mockReturnValue('Dare text');

        User.mockImplementation(() => ({
            get: jest.fn(),
            canCreate: jest.fn().mockResolvedValue(true) // canCreate returns true
        }));

        const dareHandlerInstance = { createDare: jest.fn() };
        DareHandler.mockImplementation(() => dareHandlerInstance);

        await command.execute(interaction);

        expect(interaction.options.getSubcommand).toHaveBeenCalled();
        expect(DareHandler).toHaveBeenCalledWith(interaction.client);
        expect(dareHandlerInstance.createDare).toHaveBeenCalledWith(interaction);
        expect(interaction.reply).not.toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Aborted creation') }));
    });

    test('should execute truth subcommand successfully', async () => {
        interaction.options.getSubcommand.mockReturnValue('truth');
        interaction.options.getString.mockReturnValue('Truth text');

        const mockDb = new Database();
        mockDb.createdWithin.mockResolvedValue([]); // No previous dares or truths created within 2 minutes

        const truthHandlerInstance = { createTruth: jest.fn() };
        TruthHandler.mockImplementation(() => truthHandlerInstance);

        await command.execute(interaction);

        expect(interaction.options.getSubcommand).toHaveBeenCalled();
        expect(TruthHandler).toHaveBeenCalledWith(interaction.client);
        expect(truthHandlerInstance.createTruth).toHaveBeenCalledWith(interaction);
        expect(interaction.reply).not.toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Aborted creation') }));
    });

    test('should abort creation if a truth or truth was created within 2 minutes', async () => {
        interaction.options.getSubcommand.mockReturnValue('truth');

        Database.mockImplementation(() => ({
            createdWithin: jest.fn().mockResolvedValue([{}])
        }))

        await command.execute(interaction);

        expect(interaction.reply).toHaveBeenCalledWith({
            content: expect.stringContaining('Aborted creation: User attempted to create a Truth or Dare within 2 minutes'),
            ephemeral: true
        });
        expect(logger.error).toHaveBeenCalledWith("Aborted creation: User attempted to create a Truth or Dare within 2 minutes");
    });

    test('should abort creation if a dare or truth was created within 2 minutes', async () => {
        interaction.options.getSubcommand.mockReturnValue('dare');

        Database.mockImplementation(() => ({
            createdWithin: jest.fn().mockResolvedValue([{}])
        }))

        await command.execute(interaction);

        expect(interaction.reply).toHaveBeenCalledWith({
            content: expect.stringContaining('Aborted creation: User attempted to create a Truth or Dare within 2 minutes'),
            ephemeral: true
        });
        expect(logger.error).toHaveBeenCalledWith("Aborted creation: User attempted to create a Truth or Dare within 2 minutes");
    });

    test('should log an error for invalid subcommand', async () => {
        interaction.options.getSubcommand.mockReturnValue('invalid');

        await command.execute(interaction);

        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Aborted creation: Invalid type specified'));
    });
});
