const Database = require('objects/database'); // Adjust the path to your Database class file
const Server = require('objects/server'); // Adjust the path to your Server class file
const { applyGlobals } = require('tests/setuptest.js');

let serverData = {
    id: 1,
    name: 'Test Server',
    owner: 'OwnerID',
    hasAccepted: 1,
    isBanned: 0,
    banReason: null,
    date_created: new Date(),
    date_updated: new Date(),
    dare_success_xp: 50,
    dare_fail_xp: 25,
    truth_success_xp: 40,
    truth_fail_xp: 40,
    level_up_channel: 'ChannelID1',
    announcement_channel: 'ChannelID2',
    is_entitled: true,
    entitlement_end_date: new Date(Date.now() + 10000),
    message_id: 'MessageID'
}


jest.mock('objects/database', () => {
    return jest.fn().mockImplementation(() => {
        return {
            connect: jest.fn(),
            query: jest.fn(),
            get: jest.fn().mockResolvedValue({
                id: 1,
                name: 'Test Server',
                owner: 'OwnerID',
                hasAccepted: 1,
                isBanned: 0,
                banReason: null,
                date_created: new Date(),
                date_updated: new Date(),
                dare_success_xp: 50,
                dare_fail_xp: 25,
                truth_success_xp: 40,
                truth_fail_xp: 40,
                level_up_channel: 'ChannelID1',
                announcement_channel: 'ChannelID2',
                is_entitled: true,
                entitlement_end_date: new Date(Date.now() + 10000),
                message_id: 'MessageID'
            }),
            set: jest.fn((table, data) => {
                return Promise.resolve(); // Simulate async behavior with a resolved promise
            }),
            end: jest.fn()
        };
    });
});

describe.skip('Server', () => {
    let dbMock;
    /** @type {Server} */
    let server;

    beforeEach(() => {
        applyGlobals(); // This will set global.my before each test

        dbMock = new Database();
        server = new Server(1, 'Test Server');
        server._db = dbMock; // Inject mock database instance
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should instantiate with given id and name', () => {
        expect(server.id).toBe(1);
        expect(server.name).toBe('Test Server');
    });

    test('should load server data correctly', async () => {

        await server.load();

        expect(server.name).toBe(serverData.name);
        expect(server.owner).toBe(serverData.owner);
        expect(server.hasAccepted).toBe(serverData.hasAccepted);
        // ... check other properties
    });

    test('should save server data correctly', async () => {
        await server.save();

        const expectedData = {
            id: 1,
            name: 'Test Server',
            owner: null,
            hasAccepted: 0,
            isBanned: 0,
            banReason: null,
            level_up_channel: null,
            announcement_channel: null,
            message_id: null,
            dare_success_xp: 50,
            dare_fail_xp: 25,
            message_xp: 0,
            truth_success_xp: 40,
            truth_fail_xp: 40,
            is_entitled: false,
            entitlement_end_date: null,
        };


        expect(dbMock.set).toHaveBeenCalledWith('servers', expectedData);
    });

    test('should find and load server by message ID', async () => {
        dbMock.query.mockResolvedValue([{ id: 2 }]);
        server.load = jest.fn().mockResolvedValue();

        await server.find('MessageID');

        expect(server.id).toBe(2);
        expect(server.load).toHaveBeenCalled();
    });

    test('should set level role correctly when role does not exist', async () => {
        dbMock.query
            .mockResolvedValueOnce([]) // No role found for getLevelRole
            .mockResolvedValueOnce([]); // Mock response for insert query

        await server.setLevelRole('RoleID', 10);

        expect(dbMock.query).toHaveBeenCalledWith(`INSERT INTO server_level_roles (server_id, role_id, level) VALUES ('1', 'RoleID', 10)`);
    });

    test('should set level role correctly when role exists', async () => {
        dbMock.query
            .mockResolvedValueOnce([{ role_id: 'OldRoleID' }]) // Role found for getLevelRole
            .mockResolvedValueOnce([]); // Mock response for update query

        await server.setLevelRole('RoleID', 10);

        expect(dbMock.query).toHaveBeenCalledWith(`UPDATE server_level_roles SET role_id = 'RoleID' WHERE server_id = '1' AND level = 10`);
    });

    test('should return correct role for a specific level', async () => {
        dbMock.query.mockResolvedValue([{ role_id: 'RoleID' }]);

        const role = await server.getLevelRole(10);

        expect(role).toBe('RoleID');
        expect(dbMock.query).toHaveBeenCalledWith(`
            SELECT role_id 
            FROM server_level_roles 
            WHERE server_id = '1' AND level <= 10
            ORDER BY level DESC
            LIMIT 1
        `);
    });

    test('should check premium status correctly', async () => {
        server._loaded = false;
        server.load = jest.fn().mockResolvedValue();
        server.is_entitled = true;
        server.entitlement_end_date = new Date(Date.now() + 10000); // Future date

        const hasPremium = await server.hasPremium();

        expect(server.load).toHaveBeenCalled();
        expect(hasPremium).toBe(true);
    });

    test('should set XP rates correctly', () => {
        server.setXpRate('dare_success', 60);
        expect(server.dare_success_xp).toBe(60);

        server.setXpRate('truth_fail', 30);
        expect(server.truth_fail_xp).toBe(30);
    });

    test('should return correct acceptance string', () => {
        server.hasAccepted = 1;
        expect(server.acceptedString()).toBe('Yes');

        server.hasAccepted = 0;
        expect(server.acceptedString()).toBe('No');
    });

    test('should return correct banned string', () => {
        server.isBanned = 1;
        expect(server.bannedString()).toBe('Yes');

        server.isBanned = 0;
        expect(server.bannedString()).toBe('No');
    });
});
