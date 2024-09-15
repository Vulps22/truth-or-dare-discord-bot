// rules.test.js

const rulesCommand = require('commands/global/rules');
const embedder = require('embedder');

jest.mock('embedder');

describe('rules command', () => {
  let interaction;

  beforeEach(() => {
    interaction = {
      reply: jest.fn(),
    };

    // Clear mocks before each test
    embedder.rules.mockClear();
  });

  test('should reply with the rules embed', async () => {
    const rulesEmbed = { title: 'Rules Embed' }; // Mocked embed object
    embedder.rules.mockReturnValue(rulesEmbed);

    await rulesCommand.execute(interaction);

    expect(embedder.rules).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({ embeds: [rulesEmbed] });
  });
});
