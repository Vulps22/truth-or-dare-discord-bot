const { EntitlementType } = require('discord.js');
const Database = require('objects/database');
const Purchase = require('objects/purchase');

// Mock the database
jest.mock('objects/database');

describe('Purchase', () => {
    let purchase;
    
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        Database.mockClear();
        
        purchase = new Purchase('test-id');
    });

    describe('constructor', () => {
        test('should initialize with correct defaults', () => {
            expect(purchase.id).toBe('test-id');
            expect(purchase._loaded).toBe(false);
            expect(purchase.startDate).toBeInstanceOf(Date);
            expect(purchase.deleted).toBe(false);
            expect(purchase.consumed).toBe(false);
        });
    });

    describe('load', () => {
        test('should load purchase data from database', async () => {
            const mockData = {
                skuId: 'premium-1',
                userId: 'user-123',
                guildId: 'guild-123',
                type: EntitlementType.GuildSubscription,
                start_timestamp: '2024-03-20 12:00:00',
                end_timestamp: '2024-04-20 12:00:00',
                deleted: false,
                consumed: false
            };

            Database.prototype.get.mockResolvedValue(mockData);

            await purchase.load();

            expect(Database.prototype.get).toHaveBeenCalledWith('entitlements', 'test-id');
            expect(purchase.skuId).toBe(mockData.skuId);
            expect(purchase.userId).toBe(mockData.userId);
            expect(purchase._loaded).toBe(true);
        });

        test('should handle non-existent purchase', async () => {
            Database.prototype.get.mockResolvedValue(null);

            await purchase.load();

            expect(purchase._loaded).toBe(false);
        });
    });

    describe('save', () => {
        test('should save purchase data to database', async () => {
            purchase.skuId = 'premium-1';
            purchase.userId = 'user-123';
            purchase.guildId = 'guild-123';
            purchase.type = EntitlementType.GuildSubscription;

            await purchase.save();

            expect(Database.prototype.set).toHaveBeenCalledWith('entitlements', expect.objectContaining({
                id: 'test-id',
                skuId: 'premium-1',
                userId: 'user-123'
            }));
        });
    });

    describe('static get', () => {
        test('should retrieve and load existing purchase', async () => {
            const mockData = {
                skuId: 'premium-1',
                userId: 'user-123'
            };
            Database.prototype.get.mockResolvedValue(mockData);

            const result = await Purchase.get('test-id');

            expect(result).toBeInstanceOf(Purchase);
            expect(result.id).toBe('test-id');
            expect(result.skuId).toBe(mockData.skuId);
        });
    });

    describe('static withData', () => {
        test('should create purchase from entitlement data', async () => {
            const entitlement = {
                id: 'test-id',
                skuId: 'premium-1',
                userId: 'user-123',
                guildId: 'guild-123',
                type: EntitlementType.GuildSubscription,
                startsTimestamp: Date.now(),
                endsTimestamp: Date.now() + 1000000,
                deleted: false,
                consumed: false
            };

            const result = await Purchase.withData(entitlement);

            expect(result).toBeInstanceOf(Purchase);
            expect(result.id).toBe(entitlement.id);
            expect(result.skuId).toBe(entitlement.skuId);
            expect(Database.prototype.set).toHaveBeenCalled();
        });

        test('should handle entitlement without end date', async () => {
            const entitlement = {
                id: 'test-id',
                skuId: 'premium-1',
                userId: 'user-123',
                guildId: 'guild-123',
                type: EntitlementType.GuildSubscription,
                startsTimestamp: Date.now(),
                endsTimestamp: null,
                deleted: false,
                consumed: false
            };

            const result = await Purchase.withData(entitlement);

            expect(result.endDate).toBeNull();
        });

        test('should use current date when startsTimestamp is not provided', async () => {
            const entitlement = {
                id: 'test-id',
                skuId: 'premium-1',
                userId: 'user-123',
                guildId: 'guild-123',
                type: EntitlementType.GuildSubscription,
                startsTimestamp: null,  // Explicitly null
                endsTimestamp: null,
                deleted: false,
                consumed: false
            };

            const result = await Purchase.withData(entitlement);

            expect(result.startDate).toBeInstanceOf(Date);
            // Verify it's within the last second (allowing for test execution time)
            expect(Date.now() - result.startDate.getTime()).toBeLessThan(1000);
        });
    });

    describe('timestampToMySQLDateTime', () => {
        test('should format date correctly', () => {
            const testDate = new Date('2024-03-20T12:34:56');
            const result = purchase.timestampToMySQLDateTime(testDate);
            expect(result).toBe('2024-03-20 12:34:56');
        });

        test('should pad single digits', () => {
            const testDate = new Date('2024-01-05T02:04:06');
            const result = purchase.timestampToMySQLDateTime(testDate);
            expect(result).toBe('2024-01-05 02:04:06');
        });

        test('should handle null or invalid date', () => {
            // Test null date
            expect(() => purchase.timestampToMySQLDateTime(null))
                .toThrow();

            // Test invalid date
            expect(() => purchase.timestampToMySQLDateTime('not a date'))
                .toThrow();
        });

        test('should handle date at month/year boundaries', () => {
            // Test December 31st
            const yearEnd = new Date('2024-12-31T23:59:59');
            expect(purchase.timestampToMySQLDateTime(yearEnd))
                .toBe('2024-12-31 23:59:59');

            // Test January 1st
            const yearStart = new Date('2024-01-01T00:00:00');
            expect(purchase.timestampToMySQLDateTime(yearStart))
                .toBe('2024-01-01 00:00:00');
        });
    });
});