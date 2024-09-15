// rank.test.js

const rankCommand = require('commands/global/rank');
const UserHandler = require('handlers/userHandler');
const RankCard = require('objects/rankCard');

jest.mock('handlers/userHandler');
jest.mock('objects/rankCard');

describe('rank command', () => {
  let interaction;

  beforeEach(() => {
    interaction = {
      options: {
        getUser: jest.fn(),
      },
      user: {
        id: 'test-user-id',
      },
      guildId: 'test-guild-id',
      deferReply: jest.fn(),
      editReply: jest.fn(),
    };

    // Clear mocks before each test
    UserHandler.mockClear();
    RankCard.mockClear();
  });

  test('should handle when a user is provided', async () => {
    const discordUser = { id: 'provided-user-id' };
    interaction.options.getUser.mockReturnValue(discordUser);

    const userInstance = {
      loadServerUser: jest.fn().mockResolvedValue(),
      getImage: jest.fn().mockResolvedValue('user-image'),
    };

    const rankCardInstance = {
      generateCard: jest.fn().mockResolvedValue('rank-card'),
    };

    const userHandlerInstance = {
      getUser: jest.fn().mockResolvedValue(userInstance),
    };

    UserHandler.mockImplementation(() => userHandlerInstance);
    RankCard.mockImplementation(() => rankCardInstance);

    await rankCommand.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(userHandlerInstance.getUser).toHaveBeenCalledWith('provided-user-id');
    expect(userInstance.loadServerUser).toHaveBeenCalledWith('test-guild-id');
    expect(userInstance.getImage).toHaveBeenCalled();
    expect(rankCardInstance.generateCard).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith({ files: ['rank-card'] });
  });

  test('should handle when no user is provided', async () => {
    interaction.options.getUser.mockReturnValue(null);

    const userInstance = {
      loadServerUser: jest.fn().mockResolvedValue(),
      getImage: jest.fn().mockResolvedValue('user-image'),
    };

    const rankCardInstance = {
      generateCard: jest.fn().mockResolvedValue('rank-card'),
    };

    const userHandlerInstance = {
      getUser: jest.fn().mockResolvedValue(userInstance),
    };

    UserHandler.mockImplementation(() => userHandlerInstance);
    RankCard.mockImplementation(() => rankCardInstance);

    await rankCommand.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(userHandlerInstance.getUser).toHaveBeenCalledWith('test-user-id');
    expect(userInstance.loadServerUser).toHaveBeenCalledWith('test-guild-id');
    expect(userInstance.getImage).toHaveBeenCalled();
    expect(rankCardInstance.generateCard).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith({ files: ['rank-card'] });
  });

  test('should handle when user data is not found', async () => {
    interaction.options.getUser.mockReturnValue(null);

    const userHandlerInstance = {
      getUser: jest.fn().mockResolvedValue(null),
    };

    UserHandler.mockImplementation(() => userHandlerInstance);

    await rankCommand.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(userHandlerInstance.getUser).toHaveBeenCalledWith('test-user-id');
    expect(interaction.editReply).toHaveBeenCalledWith(
      "Hmm, I can't find your user data. This might be a bug, try again later"
    );
  });
});
