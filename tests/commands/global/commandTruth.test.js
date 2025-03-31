const command = require('commands/global/truth'); // Adjust the path if needed
const TruthHandler = require('handlers/truthHandler');

jest.mock('handlers/truthHandler');

    // Update the mocks to match the refactor in #59
describe.skip('Truth Command', () => {
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

        TruthHandler.mockClear();
    });

    afterAll(() => {
        console.log.mockRestore();
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
        expect(truthHandlerInstance.getQuestion).toHaveBeenCalledWith(interaction);
    });
});
