
describe('Database', () => {
    test('Not Implemented', () => {
        expect(true).toBe(true);
    })
});

/*
const { createConnection } = require('mysql2/promise');
const Database = require('../objects/database'); // Adjust the path to your Database class file

jest.mock('mysql2/promise', () => ({
    ...jest.requireActual('mysql2/promise'), // Import the actual module
        createConnection: jest.fn(() => ({
            query: jest.fn().mockResolvedValue([[], []]),
            end: jest.fn()
        }))
}));


describe('Database', () => {
    let db;

    beforeEach(() => {
        db = new Database();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test.only('connects successfully', async () => {
        const mConnection = createConnection();

        await db.connect();

        expect(createConnection).toHaveBeenCalledTimes(1);
        expect(mConnection.query).toHaveBeenCalledWith('SELECT 1');
    });

    test('retries connection on ECONNREFUSED', async () => {
        const mConnection = createConnection();
        mConnection.connect
            .mockImplementationOnce((cb) => cb({ code: 'ECONNREFUSED' }))
            .mockImplementationOnce((cb) => cb({ code: 'ECONNREFUSED' }))
            .mockImplementationOnce((cb) => cb(null));

        await db.connect();

        expect(mConnection.connect).toHaveBeenCalledTimes(3);
    }, 30000);

    test('throws an error after max retries', async () => {
        const mConnection = createConnection();
        mConnection.connect.mockImplementation((cb) => cb({ code: 'ECONNREFUSED' }));

        await expect(db.connect()).rejects.toMatchObject({ code: 'ECONNREFUSED' });

        expect(mConnection.connect).toHaveBeenCalledTimes(4);
    }, 30000); // 30 seconds


    test('executes a query successfully', async () => {
        const mConnection = createConnection();
        const queryResult = [{ id: 1, name: 'test' }];
        mConnection.query.mockImplementation((sql, cb) => cb(null, queryResult));

        const result = await db.query('SELECT * FROM test');

        expect(mConnection.query).toHaveBeenCalledWith('SELECT * FROM test', expect.any(Function));
        expect(result).toEqual(queryResult);
    });

    test('throws an error on query failure', async () => {
        const mConnection = createConnection();
        const queryError = new Error('Query failed');
        mConnection.query.mockImplementation((sql, cb) => cb(queryError));

        await expect(db.query('SELECT * FROM test')).rejects.toThrow(queryError);

        expect(mConnection.query).toHaveBeenCalledWith('SELECT * FROM test', expect.any(Function));
    });

    test('get method works', async () => {
        const mConnection = createConnection();
        const queryResult = [{ id: 1, name: 'test' }];
        mConnection.query.mockImplementation((sql, cb) => cb(null, queryResult));

        const result = await db.get('test', 1);

        expect(mConnection.query).toHaveBeenCalledWith("SELECT * FROM test WHERE id='1'", expect.any(Function));
        expect(result).toEqual(queryResult[0]);
    });

    test('set generates correct SQL query', async () => {
        const mConnection = createConnection();
        const mockQuery = jest.spyOn(db, 'query').mockResolvedValue({ insertId: 1 });

        const table = 'testTable';
        const valueObject = { id: 1, name: 'test', age: 25 };
        const idField = 'id';

        await db.set(table, valueObject, idField);

        const expectedSql = `INSERT INTO \`testTable\` (\`id\`, name, age) VALUES (1, 'test', 25) ON DUPLICATE KEY UPDATE \`name\` = 'test', \`age\` = 25` // Normalize whitespace for comparison

        expect(mockQuery).toHaveBeenCalledWith(expectedSql);

        mockQuery.mockRestore(); // Restore the original implementation of db.query
    });

    test('delete method works', async () => {
        const mConnection = createConnection();
        mConnection.query.mockImplementation((sql, cb) => cb(null, { affectedRows: 1 }));

        const result = await db.delete('test', 1);

        expect(mConnection.query).toHaveBeenCalledWith('DELETE FROM test WHERE id=1', expect.any(Function));
        expect(result.affectedRows).toBe(1);
    });

    test('createdWithin method works', async () => {
        const mConnection = createConnection();
        const queryResult = [{ id: 1, name: 'test' }];
        mConnection.query.mockImplementation((sql, cb) => cb(null, queryResult));

        const result = await db.createdWithin('test', 10, 1);

        expect(mConnection.query).toHaveBeenCalledWith('SELECT * FROM test WHERE created >= NOW() - INTERVAL 10 MINUTE AND creator = 1', expect.any(Function));
        expect(result).toEqual(queryResult);
    });

    test('list method works', async () => {
        const mConnection = createConnection();
        const queryResult = [{ id: 1, name: 'test' }];
        mConnection.query.mockImplementation((sql, cb) => cb(null, queryResult));

        const result = await db.list('test', 10, 'ASC', 0);

        expect(mConnection.query).toHaveBeenCalledWith('SELECT * FROM test ORDER BY id ASC LIMIT 10 OFFSET 0', expect.any(Function));
        expect(result).toEqual(queryResult);
    });

    test('like method works', async () => {
        const mConnection = createConnection();
        const queryResult = [{ id: 1, name: 'test' }];
        mConnection.query.mockImplementation((sql, cb) => cb(null, queryResult));

        const result = await db.like('test', 'name', '%test%', 10, 'ASC');

        expect(mConnection.query).toHaveBeenCalledWith("SELECT * FROM test WHERE name LIKE '%test%' AND isBanned = 0 ORDER BY name ASC LIMIT 10", expect.any(Function));
        expect(result).toEqual(queryResult);
    });
});
*/