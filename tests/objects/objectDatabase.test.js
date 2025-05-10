const mysql = require('mysql2');
const Database = require('objects/database');

// Mock mysql2
jest.mock('mysql2', () => ({
    createConnection: jest.fn(() => ({
        connect: jest.fn(),
        query: jest.fn(),
        end: jest.fn()
    })),
    escape: jest.fn(value => `'${value}'`)  // Simple mock for escape
}));

describe.skip('Database', () => {
    /** @type {Database} */
    let db;
    let mockConnection;
    let originalConsoleLog;

    beforeEach(() => {
        // Save original console.log
        originalConsoleLog = console.log;
        // Mock console.log
        console.log = jest.fn();
        
        // Clear all mocks
        jest.clearAllMocks();
        
        // Create fresh mock connection
        mockConnection = {
            connect: jest.fn(),
            query: jest.fn(),
            end: jest.fn()
        };
        mysql.createConnection.mockReturnValue(mockConnection);
        
        // Create fresh database instance
        db = new Database();
    });

    afterEach(() => {
        // Restore original console.log
        console.log = originalConsoleLog;
    });

    describe('connect', () => {
        test('connects successfully', async () => {
            mockConnection.connect.mockImplementation(cb => cb(null));
            
            await db.connect();
            
            expect(mysql.createConnection).toHaveBeenCalledWith({
                host: process.env['DATABASE_HOST'],
                port: process.env['DATABASE_PORT'],
                user: process.env['DATABASE_USER'],
                password: process.env['DATABASE_PASSWORD'],
                database: process.env['DATABASE']
            });
        });

        test('retries on connection refused', async () => {
            jest.useFakeTimers();
            
            const error = { code: 'ECONNREFUSED' };
            mockConnection.connect
                .mockImplementationOnce(cb => cb(error))
                .mockImplementationOnce(cb => cb(null));
            
            const connectPromise = db.connect();
            
            // Fast-forward through setTimeout
            jest.advanceTimersByTime(5000);
            
            await connectPromise;
            
            expect(mockConnection.connect).toHaveBeenCalledTimes(2);
            
            jest.useRealTimers();
        });

        test('immediately rejects non-ECONNREFUSED errors', async () => {
            const nonConnectionError = { 
                code: 'ER_ACCESS_DENIED_ERROR',
                message: 'Access denied'
            };
            
            mockConnection.connect.mockImplementation(cb => cb(nonConnectionError));
            
            await expect(db.connect())
                .rejects
                .toEqual(nonConnectionError);
                
            // Should only try once, no retries
            expect(mockConnection.connect).toHaveBeenCalledTimes(1);
        });
    });

    describe('query', () => {
        test('executes query successfully', async () => {
            const mockResults = [{ id: 1 }];
            mockConnection.connect.mockImplementation(cb => cb(null));
            mockConnection.query.mockImplementation((sql, cb) => cb(null, mockResults));

            const result = await db.query('SELECT * FROM test');

            expect(result).toEqual(mockResults);
            expect(mockConnection.end).toHaveBeenCalled();
        });

        test('handles query error', async () => {
            const mockError = new Error('Query failed');
            mockConnection.connect.mockImplementation(cb => cb(null));
            mockConnection.query.mockImplementation((sql, cb) => cb(mockError));

            await expect(db.query('SELECT * FROM test'))
                .rejects.toThrow(mockError);
        });

        test('handles unexpected errors in query', async () => {
            // Make connect throw a synchronous error
            jest.spyOn(db, 'connect').mockImplementation(() => {
                throw new Error('Sync connect error');
            });

            const testQuery = 'SELECT * FROM test';
            
            try {
                await db.query(testQuery);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).toContain('Unexpected Error in database query');
                expect(error.message).toContain(testQuery);
                expect(error.message).toContain('Sync connect error');
            }
        });
    });

    describe('escape', () => {
        test('escapes string values', () => {
            expect(db.escape('test')).toBe("'test'");
        });

        test('handles numbers', () => {
            expect(db.escape(123)).toBe(123);
        });

        test('handles dates', () => {
            const date = new Date('2023-01-01T12:00:00');
            expect(db.escape(date)).toMatch(/'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'/);
        });

        test('handles booleans', () => {
            expect(db.escape(true)).toBe(1);
            expect(db.escape(false)).toBe(0);
        });

        test('handles null/undefined', () => {
            expect(db.escape(null)).toBe('NULL');
            expect(db.escape(undefined)).toBe('NULL');
        });

        test('throws on unsupported types', () => {
            expect(() => db.escape({})).toThrow('Unsupported type: object');
        });
    });

    describe('get', () => {
        test('retrieves single record by id', async () => {
            const mockRow = { id: 1, name: 'test' };
            mockConnection.query.mockImplementation((sql, cb) => cb(null, [mockRow]));
            mockConnection.connect.mockImplementation(cb => cb(null));

            const result = await db.get('users', 1);

            expect(result).toEqual(mockRow);
            expect(mockConnection.query).toHaveBeenCalledWith(
                "SELECT * FROM users WHERE id='1'",
                expect.any(Function)
            );
        });

        test('returns undefined when no record found', async () => {
            mockConnection.query.mockImplementation((sql, cb) => cb(null, []));
            mockConnection.connect.mockImplementation(cb => cb(null));

            const result = await db.get('users', 1);

            expect(result).toBeUndefined();
        });

        test('uses custom id field when provided', async () => {
            mockConnection.query.mockImplementation((sql, cb) => cb(null, []));
            mockConnection.connect.mockImplementation(cb => cb(null));

            await db.get('users', 'test@email.com', 'email');

            expect(mockConnection.query).toHaveBeenCalledWith(
                "SELECT * FROM users WHERE email='test@email.com'",
                expect.any(Function)
            );
        });
    });

    describe('set', () => {
        test('inserts new record without id', async () => {
            const mockResult = { insertId: 1 };
            mockConnection.query.mockImplementation((sql, cb) => cb(null, mockResult));
            mockConnection.connect.mockImplementation(cb => cb(null));

            const valueObject = { name: 'test', email: 'test@email.com' };
            const result = await db.set('users', valueObject);

            expect(result).toBe(1);
            expect(mockConnection.query).toHaveBeenCalledWith(
                expect.stringMatching(/^INSERT INTO `users` \(name, email\) VALUES/),
                expect.any(Function)
            );
        });

        test('updates existing record with id', async () => {
            const mockResult = { insertId: 1 };
            mockConnection.query.mockImplementation((sql, cb) => cb(null, mockResult));
            mockConnection.connect.mockImplementation(cb => cb(null));

            const valueObject = { id: 1, name: 'test', email: 'test@email.com' };
            await db.set('users', valueObject);

            expect(mockConnection.query).toHaveBeenCalledWith(
                expect.stringMatching(/ON DUPLICATE KEY UPDATE/),
                expect.any(Function)
            );
        });
    });

    describe('delete', () => {
        test('deletes record by id', async () => {
            mockConnection.query.mockImplementation((sql, cb) => cb(null, {}));
            mockConnection.connect.mockImplementation(cb => cb(null));

            await db.delete('users', 1);

            expect(mockConnection.query).toHaveBeenCalledWith(
                'DELETE FROM users WHERE id=1',
                expect.any(Function)
            );
        });

        test('uses custom id field when provided', async () => {
            mockConnection.query.mockImplementation((sql, cb) => cb(null, {}));
            mockConnection.connect.mockImplementation(cb => cb(null));

            await db.delete('users', 'test@email.com', 'email');

            expect(mockConnection.query).toHaveBeenCalledWith(
                'DELETE FROM users WHERE email=test@email.com',
                expect.any(Function)
            );
        });
    });

    describe('list', () => {
        test('lists all records without conditions', async () => {
            mockConnection.query.mockImplementation((sql, cb) => cb(null, []));
            mockConnection.connect.mockImplementation(cb => cb(null));

            await db.list('users');

            expect(mockConnection.query).toHaveBeenCalledWith(
                'SELECT * FROM users  ORDER BY id ASC ',
                expect.any(Function)
            );
        });

        test('applies where clause when provided', async () => {
            mockConnection.query.mockImplementation((sql, cb) => cb(null, []));
            mockConnection.connect.mockImplementation(cb => cb(null));

            await db.list('users', 'active=1');

            expect(mockConnection.query).toHaveBeenCalledWith(
                'SELECT * FROM users WHERE active=1 ORDER BY id ASC ',
                expect.any(Function)
            );
        });

        test('applies limit and page when provided', async () => {
            mockConnection.query.mockImplementation((sql, cb) => cb(null, []));
            mockConnection.connect.mockImplementation(cb => cb(null));

            await db.list('users', '', 10, 'ASC', 2);

            expect(mockConnection.query).toHaveBeenCalledWith(
                'SELECT * FROM users  ORDER BY id ASC LIMIT 10 OFFSET 20',
                expect.any(Function)
            );
        });
    });

    describe('like', () => {
        test('performs LIKE query with default options', async () => {
            mockConnection.query.mockImplementation((sql, cb) => cb(null, []));
            mockConnection.connect.mockImplementation(cb => cb(null));

            await db.like('users', 'name', 'test%');

            expect(mockConnection.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT \* FROM users WHERE name LIKE 'test%' AND isBanned = 0 ORDER BY name ASC/),
                expect.any(Function)
            );
        });

        test('throws error on invalid order parameter', () => {
            expect(() => 
                db.like('users', 'name', 'test%', 0, 'INVALID')
            ).toThrow('Invalid order parameter. Must be either "ASC" or "DESC".');
        });

        test('performs LIKE query without banned filter when excludeBanned is false', async () => {
            mockConnection.query.mockImplementation((sql, cb) => cb(null, []));
            mockConnection.connect.mockImplementation(cb => cb(null));

            await db.like('users', 'name', 'test%', 0, 'ASC', false);

            expect(mockConnection.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT \* FROM users WHERE name LIKE 'test%'  ORDER BY name ASC/),
                expect.any(Function)
            );
        });

        test('includes LIMIT when limit is greater than 0', async () => {
            mockConnection.query.mockImplementation((sql, cb) => cb(null, []));
            mockConnection.connect.mockImplementation(cb => cb(null));

            await db.like('users', 'name', 'test%', 10);

            expect(mockConnection.query).toHaveBeenCalledWith(
                expect.stringMatching(/LIMIT 10$/),
                expect.any(Function)
            );
        });

        test('omits LIMIT when limit is 0', async () => {
            mockConnection.query.mockImplementation((sql, cb) => cb(null, []));
            mockConnection.connect.mockImplementation(cb => cb(null));

            await db.like('users', 'name', 'test%', 0);

            expect(mockConnection.query).toHaveBeenCalledWith(
                expect.not.stringMatching(/LIMIT/),
                expect.any(Function)
            );
        });

        test('omits LIMIT when limit is negative', async () => {
            mockConnection.query.mockImplementation((sql, cb) => cb(null, []));
            mockConnection.connect.mockImplementation(cb => cb(null));

            await db.like('users', 'name', 'test%', -1);

            expect(mockConnection.query).toHaveBeenCalledWith(
                expect.not.stringMatching(/LIMIT/),
                expect.any(Function)
            );
        });
    });

    describe('createdWithin', () => {
        test('finds records created within time interval', async () => {
            mockConnection.query.mockImplementation((sql, cb) => cb(null, []));
            mockConnection.connect.mockImplementation(cb => cb(null));

            await db.createdWithin('users', 60, 123);

            expect(mockConnection.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT \* FROM users WHERE created >= NOW\(\) - INTERVAL 60 MINUTE AND creator = 123/),
                expect.any(Function)
            );
        });
    });
});