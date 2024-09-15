// report.test.js

const reportCommand = require('commands/global/report');
const Database = require('objects/database');
const { WebhookClient } = require('discord.js');

jest.mock('objects/database');
jest.mock('discord.js', () => {
  const originalModule = jest.requireActual('discord.js');
  return {
    ...originalModule,
    WebhookClient: jest.fn(),
  };
});

describe('report command', () => {
  let interaction;
  let webhookSendMock;

  beforeEach(() => {
    interaction = {
      options: {
        getSubcommand: jest.fn(),
        getString: jest.fn(),
        getNumber: jest.fn(),
      },
      user: {
        id: 'test-user-id',
      },
      guildId: 'test-guild-id',
      reply: jest.fn(),
    };

    // Mock the Database class
    Database.mockClear();
    Database.prototype.set = jest.fn().mockResolvedValue();
    Database.prototype.get = jest.fn();

    // Mock the WebhookClient
    webhookSendMock = jest.fn().mockResolvedValue();
    WebhookClient.mockImplementation(() => {
      return {
        send: webhookSendMock,
      };
    });
  });

  test('should handle reporting a dare', async () => {
    interaction.options.getSubcommand.mockReturnValue('dare');
    interaction.options.getString.mockReturnValue('This is a test reason');
    interaction.options.getNumber.mockReturnValue(123);

    Database.prototype.get.mockResolvedValue({ question: 'Test dare question' });

    await reportCommand.execute(interaction);

    expect(interaction.options.getSubcommand).toHaveBeenCalled();
    expect(interaction.options.getString).toHaveBeenCalledWith('reason');
    expect(interaction.options.getNumber).toHaveBeenCalledWith('id');

    expect(Database.prototype.set).toHaveBeenCalledWith('reports', {
      type: 'dare',
      sender: 'test-user-id',
      reason: 'This is a test reason',
      offenderId: 123,
    });

    expect(Database.prototype.get).toHaveBeenCalledWith('dares', 123);

    expect(webhookSendMock).toHaveBeenCalledWith(
      expect.stringContaining('New report received')
    );

    expect(interaction.reply).toHaveBeenCalledWith({
      content: 'Your report has been submitted. Only you can see this message.',
      ephemeral: true,
    });
  });

  test('should handle reporting a truth', async () => {
    interaction.options.getSubcommand.mockReturnValue('truth');
    interaction.options.getString.mockReturnValue('This is a test reason');
    interaction.options.getNumber.mockReturnValue(456);

    Database.prototype.get.mockResolvedValue({ question: 'Test truth question' });

    await reportCommand.execute(interaction);

    expect(Database.prototype.set).toHaveBeenCalledWith('reports', {
      type: 'truth',
      sender: 'test-user-id',
      reason: 'This is a test reason',
      offenderId: 456,
    });

    expect(Database.prototype.get).toHaveBeenCalledWith('truths', 456);

    expect(webhookSendMock).toHaveBeenCalledWith(
      expect.stringContaining('New report received')
    );

    expect(interaction.reply).toHaveBeenCalledWith({
      content: 'Your report has been submitted. Only you can see this message.',
      ephemeral: true,
    });
  });

  test('should handle reporting a server', async () => {
    interaction.options.getSubcommand.mockReturnValue('server');
    interaction.options.getString.mockReturnValue('Server violation reason');

    await reportCommand.execute(interaction);

    expect(Database.prototype.set).toHaveBeenCalledWith('reports', {
      type: 'server',
      sender: 'test-user-id',
      reason: 'Server violation reason',
      offenderId: 'test-guild-id',
    });

    expect(webhookSendMock).toHaveBeenCalledWith(
      expect.stringContaining('New report received')
    );

    expect(interaction.reply).toHaveBeenCalledWith({
      content: 'Your report has been submitted. Only you can see this message.',
      ephemeral: true,
    });
  });

  test('should handle missing reason', async () => {
    interaction.options.getSubcommand.mockReturnValue('dare');
    interaction.options.getString.mockReturnValue(null);

    await reportCommand.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith({
      content: 'You must specify a reason. Only you can see this message',
      ephemeral: true,
    });

    // Ensure no further actions are taken
    expect(Database.prototype.set).not.toHaveBeenCalled();
    expect(webhookSendMock).not.toHaveBeenCalled();
  });
});
