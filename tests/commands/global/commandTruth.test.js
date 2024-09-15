const command = require('commands/global/truth'); // Adjust the path if needed
const TruthHandler = require('handlers/truthHandler');

jest.mock('handlers/truthHandler');

describe('Truth Command', () => {
    let interaction;

    beforeEach(() => {
        interaction = {
            client: {},
            reply: jest.fn(),
            deferReply: jest.fn(),
        };

        TruthHandler.mockClear();
    });

    test('should call TruthHandler when the command is executed', async () => {
        // Create a mock instance of TruthHandler
        const truthHandlerInstance = {
            truth: jest.fn()
        };
        TruthHandler.mockImplementation(() => truthHandlerInstance);

        // Execute the command
        await command.execute(interaction);

        // Assert that TruthHandler was instantiated
        expect(TruthHandler).toHaveBeenCalledWith(interaction.client);

        // Assert that the truth method was called
        expect(truthHandlerInstance.truth).toHaveBeenCalledWith(interaction);
    });
});
