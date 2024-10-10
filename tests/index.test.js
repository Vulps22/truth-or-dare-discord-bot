// Import the module you're testing
const { Client } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Database = require('objects/database');

// Mock the Database class
jest.mock('objects/database');
jest.mock('fs');

jest.mock('discord.js', () => {
    return {
        Client: jest.fn().mockImplementation(() => ({
            login: jest.fn(),
            on: jest.fn(),
            emit: jest.fn(),
            destroy: jest.fn(),
            user: {
                setActivity: jest.fn(),
            },
            guilds: {
                cache: new Map(),
            },
            channels: {
                fetch: jest.fn(),
            },
        })),
        GatewayIntentBits: {
            Guilds: 1,
            GuildMessages: 2,
        },
        Collection: jest.fn(() => ({
            set: jest.fn(),
            get: jest.fn(),
        })),
    };
});


describe('Main bot initialization', () => {
    let dbGetMock;

    beforeEach(() => {
        // Reset the mock
        Database.mockClear();

        // Create a mock for the 'get' method
        dbGetMock = jest.fn().mockResolvedValue({
            maintenance_mode: false,
            token: 'mock-token',
            dares_log: 'mock-dares-log',
            truths_log: 'mock-truths-log',
            servers_log: 'mock-servers-log',
            required_votes: 3,
            environment: 'prod'
        });

        // Ensure that the Database class uses the mock for 'get'
        Database.mockImplementation(() => ({
            get: dbGetMock,
            list: jest.fn().mockResolvedValue([]),  // Mock any other methods needed for testing
        }));

        fs.mockImplementation(() => ({
            readdirSync: jest.fn.mockReturnValue([])
        }))

    });

    test('should call db.get with config and 3', async () => {
        // Import the main file (this runs the main() function)
        require('index'); // Adjust the path as necessary

        // Wait for async calls to finish
        await new Promise(setImmediate);

        // Check if db.get was called with the correct table and ID (3 for production config)
        expect(dbGetMock).toHaveBeenCalledWith('config', 3);
    });
});
