const command = require('commands/global/dare'); // Adjust the path if needed
const DareHandler = require('handlers/dareHandler');

jest.mock('handlers/dareHandler');

    // Update the mocks to match the refactor in #59
describe.skip('Dare Command', () => {
    let interaction;

    beforeAll(() => {
         // Mock console.log
         jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    beforeEach(() => {
        interaction = {
            client: {},
            reply: jest.fn(),
            deferReply: jest.fn(),
        };

        DareHandler.mockClear();
    });

    afterAll(() => {
        console.log.mockRestore();
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
