// random.test.js

const randomCommand = require('commands/global/random');
const DareHandler = require('handlers/dareHandler');
const TruthHandler = require('handlers/truthHandler');

jest.mock('handlers/dareHandler');
jest.mock('handlers/truthHandler');

// TODO: Update these mocks to match the refactor in #59
describe.skip('random command', () => {
  let interaction;

  beforeAll(() => {
         // Mock console.log
         jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    interaction = {
      client: {},
    };

    // Clear mocks before each test
    DareHandler.mockClear();
    TruthHandler.mockClear();
  });

  afterAll(() => {
    console.log.mockRestore();
  });

  test('should call DareHandler.dare when random number is 1', async () => {
    // Mock Math.random to return a value that makes random == 1
    jest.spyOn(Math, 'random').mockReturnValue(0.7); // Math.floor(0.7 * 2) = 1

    const dareInstance = {
      dare: jest.fn(),
    };
    DareHandler.mockImplementation(() => dareInstance);

    await randomCommand.execute(interaction);

    expect(DareHandler).toHaveBeenCalledWith(interaction.client);
    expect(dareInstance.dare).toHaveBeenCalledWith(interaction);

    // Restore Math.random
    Math.random.mockRestore();
  });

  test('should call TruthHandler.truth when random number is 0', async () => {
    // Mock Math.random to return a value that makes random == 0
    jest.spyOn(Math, 'random').mockReturnValue(0.3); // Math.floor(0.3 * 2) = 0

    const truthInstance = {
      truth: jest.fn(),
    };
    TruthHandler.mockImplementation(() => truthInstance);

    await randomCommand.execute(interaction);

    expect(TruthHandler).toHaveBeenCalledWith(interaction.client);
    expect(truthInstance.truth).toHaveBeenCalledWith(interaction);

    // Restore Math.random
    Math.random.mockRestore();
  });
});
