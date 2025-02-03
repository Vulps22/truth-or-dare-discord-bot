// report.test.js

const reportCommand = require('commands/global/report');
const Database = require('objects/database');
const logger = require('objects/logger');
const Report = require('objects/report');

jest.mock('objects/database');
jest.mock('objects/logger');
jest.mock('objects/report');

describe('report command', () => {
  let interaction;

  beforeAll(() => {
         // Mock console.log
         jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    global.my = {
      reports_log: 'test-reports-log-id'
    };

    // Reset all mocks
    jest.clearAllMocks();

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
      deferReply: jest.fn().mockResolvedValue(),
      editReply: jest.fn().mockResolvedValue()
    };

    // Mock Report class methods
    Report.mockImplementation(() => ({
      type: null,
      senderId: null,
      serverId: null,
      reason: null,
      offenderId: null,
      save: jest.fn().mockResolvedValue('mock-report-id'),
      loadOffender: jest.fn().mockResolvedValue(null)
    }));

    // Mock the Database class
    Database.mockClear();
    Database.prototype.set = jest.fn().mockResolvedValue();
    Database.prototype.get = jest.fn();

    // Mock the logger
    logger.newReport = jest.fn().mockResolvedValue();

    // Add console.error mock
    console.error = jest.fn();
  });

  afterEach(() => {
    delete global.my;
  });

  afterAll(() => {
    console.log.mockRestore();
  });

  test('should handle reporting a dare', async () => {
    interaction.options.getSubcommand.mockReturnValue('dare');
    interaction.options.getString.mockReturnValue('This is a test reason');
    interaction.options.getNumber.mockReturnValue(123);

    await reportCommand.execute(interaction);

    // Verify Report was constructed correctly
    expect(Report).toHaveBeenCalledWith(null, "dare", "test-user-id", "This is a test reason", 123);
    
    // Get the mock Report instance
    const mockReport = Report.mock.results[0].value;
    
    // Verify Report properties were set
    expect(mockReport.type).toBe('dare');
    expect(mockReport.senderId).toBe('test-user-id');
    expect(mockReport.serverId).toBe('test-guild-id');
    expect(mockReport.reason).toBe('This is a test reason');
    expect(mockReport.offenderId).toBe(123);

    // Verify save was called
    expect(mockReport.save).toHaveBeenCalled();

    // Verify logger was called with the report
    expect(logger.newReport).toHaveBeenCalledWith(mockReport);

    expect(interaction.editReply).toHaveBeenCalledWith('Your report has been submitted. Only you can see this message.');
  });

  test('should handle reporting a truth', async () => {
    interaction.options.getSubcommand.mockReturnValue('truth');
    interaction.options.getString.mockReturnValue('This is a test reason');
    interaction.options.getNumber.mockReturnValue(456);

    await reportCommand.execute(interaction);

    const mockReport = Report.mock.results[0].value;
    
    expect(mockReport.type).toBe('truth');
    expect(mockReport.senderId).toBe('test-user-id');
    expect(mockReport.serverId).toBe('test-guild-id');
    expect(mockReport.reason).toBe('This is a test reason');
    expect(mockReport.offenderId).toBe(456);

    expect(mockReport.save).toHaveBeenCalled();
    expect(logger.newReport).toHaveBeenCalledWith(mockReport);
  });

  test('should handle reporting a server', async () => {
    interaction.options.getSubcommand.mockReturnValue('server');
    interaction.options.getString.mockReturnValue('Server violation reason');

    await reportCommand.execute(interaction);

    const mockReport = Report.mock.results[0].value;
    
    expect(mockReport.type).toBe('server');
    expect(mockReport.senderId).toBe('test-user-id');
    expect(mockReport.serverId).toBe('test-guild-id');
    expect(mockReport.reason).toBe('Server violation reason');
    expect(mockReport.offenderId).toBe('test-guild-id');

    expect(mockReport.save).toHaveBeenCalled();
    expect(logger.newReport).toHaveBeenCalledWith(mockReport);
  });

  test('should handle missing reason', async () => {
    interaction.options.getSubcommand.mockReturnValue('dare');
    interaction.options.getString.mockReturnValue(null);

    await reportCommand.execute(interaction);

    expect(Report).not.toHaveBeenCalled();
    expect(logger.newReport).not.toHaveBeenCalled();

    expect(interaction.editReply).toHaveBeenCalledWith('You must specify a reason. Only you can see this message');
  });

  test('should handle error when saving report', async () => {
    interaction.options.getSubcommand.mockReturnValue('dare');
    interaction.options.getString.mockReturnValue('Test reason');
    interaction.options.getNumber.mockReturnValue(123);

    // Mock Report to throw an error on save
    const mockReport = {
      type: 'dare',
      senderId: 'test-user-id',
      serverId: 'test-guild-id',
      reason: 'Test reason',
      offenderId: 123,
      save: jest.fn().mockRejectedValue(new Error('Failed to save')),
      loadOffender: jest.fn().mockResolvedValue(null)
    };

    Report.mockImplementation(() => mockReport);

    await reportCommand.execute(interaction);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to submit report: Error: Failed to save')
    );
    expect(interaction.editReply).toHaveBeenCalledWith(
      'There was an issue submitting your report. Please try again later.'
    );
  });

  test('should handle reporting truth/dare', async () => {
    interaction.options.getSubcommand.mockReturnValue('dare');
    interaction.options.getString.mockReturnValue('Test reason');
    interaction.options.getNumber.mockReturnValue(123);

    const mockReport = {
      type: 'dare',
      senderId: 'test-user-id',
      serverId: 'test-guild-id',
      reason: 'Test reason',
      offenderId: 123,
      save: jest.fn().mockResolvedValue('mock-report-id')
    };

    Report.mockImplementation(() => mockReport);

    await reportCommand.execute(interaction);

    // Verify logger was called with the report
    expect(logger.newReport).toHaveBeenCalledWith(mockReport);
    expect(interaction.editReply).toHaveBeenCalledWith(
      'Your report has been submitted. Only you can see this message.'
    );
  });
});
