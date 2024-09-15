const command = require('commands/global/dare'); // Adjust the path if needed
const DareHandler = require('handlers/dareHandler');

jest.mock('handlers/dareHandler');

describe('Dare Command', () => {
    let interaction;

    beforeEach(() => {
        interaction = {
            client: {},
            reply: jest.fn(),
            deferReply: jest.fn(),
        };

        DareHandler.mockClear();
    });

    test('should call DareHandler when the command is executed', async () => {
        // Create a mock instance of DareHandler
        const dareHandlerInstance = {
            dare: jest.fn()
        };
        DareHandler.mockImplementation(() => dareHandlerInstance);

        // Execute the command
        await command.execute(interaction);

        // Assert that DareHandler was instantiated
        expect(DareHandler).toHaveBeenCalledWith(interaction.client);

        // Assert that the dare method was called
        expect(dareHandlerInstance.dare).toHaveBeenCalledWith(interaction);
    });
});
