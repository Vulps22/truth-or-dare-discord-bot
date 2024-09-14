const { SlashCommandBuilder } = require("discord.js");
const command = require('commands/global/create'); // adjust the path to your file
const DareHandler = require("handlers/dareHandler");
const TruthHandler = require("handlers/truthHandler");
const Database = require("objects/database");
const logger = require("objects/logger");

jest.mock("handlers/dareHandler");
jest.mock("handlers/truthHandler");
jest.mock("objects/database");
jest.mock("objects/logger");

describe('Create Truth or Dare Command', () => {
    let interaction;

    beforeEach(() => {
        interaction = {
            options: {
                getSubcommand: jest.fn(),
                getString: jest.fn()
            },
            user: { id: '123' },
            client: {},
            reply: jest.fn(),
        };

        Database.mockClear();
        DareHandler.mockClear();
        TruthHandler.mockClear();
        logger.error.mockClear();
    });

    test('should execute dare subcommand successfully', async () => {
        interaction.options.getSubcommand.mockReturnValue('dare');
        interaction.options.getString.mockReturnValue('Dare text');
        
        const mockDb = new Database();
        mockDb.createdWithin.mockResolvedValue([]); // No previous dares or truths created within 2 minutes

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

    test('should abort creation if a dare or truth was created within 2 minutes', async () => {
        interaction.options.getSubcommand.mockReturnValue('dare');
        
        const mockDb = new Database();
        mockDb.createdWithin.mockResolvedValue([{}]); // Simulate previous creation within 2 minutes

        await command.execute(interaction);

        expect(interaction.reply).toHaveBeenCalledWith({
            content: expect.stringContaining('Aborted creation: User attempted to create a Truth or Dare within 2 minutes'),
            ephemeral: true
        });
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Aborted creation: User attempted to create a Truth or Dare within 2 minutes'));
    });

    test('should log an error for invalid subcommand', async () => {
        interaction.options.getSubcommand.mockReturnValue('invalid');

        await command.execute(interaction);

        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Aborted creation: Invalid type specified'));
    });
});
