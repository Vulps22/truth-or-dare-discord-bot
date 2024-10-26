// main.test.js
const { ShardingManager } = require('discord.js');
const Database = require('objects/database');

jest.mock('objects/database');
jest.mock('discord.js', () => ({
    ShardingManager: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        spawn: jest.fn(),
    })),
}));

describe.skip('Main Bot Initialization', () => {
    let mockDb;

    beforeEach(() => {
        mockDb = new Database();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('loads configuration from database and sets global config', async () => {
        const mockConfig = {
            maintenance_mode: true,
            secret: 'supersecrettoken',
            dares_log: '12345',
            truths_log: '67890',
            servers_log: '111213',
            required_votes: 5,
            environment: 'prod',
        };
        mockDb.get.mockResolvedValueOnce(mockConfig);

        require('index');

        expect(global.my).toEqual(mockConfig);
    });

    it('logs an error and exits if loading config from database fails', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockDb.get.mockRejectedValueOnce(new Error('Database error'));

        await main();

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error loading config from database:'));
        expect(ShardingManager).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it('initializes ShardingManager and spawns shards', async () => {
        const mockConfig = {
            maintenance_mode: false,
            secret: 'supersecrettoken',
            dares_log: '12345',
            truths_log: '67890',
            servers_log: '111213',
            required_votes: 5,
            environment: 'prod',
        };
        mockDb.get.mockResolvedValueOnce(mockConfig);

        const managerInstance = new ShardingManager();
        require('index');

        expect(managerInstance.on).toHaveBeenCalledWith('shardCreate', expect.any(Function));
        expect(managerInstance.spawn).toHaveBeenCalled();
    });
});
