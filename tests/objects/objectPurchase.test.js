const { EntitlementType } = require('discord.js');
const Database = require('objects/database');
const Purchase = require('objects/purchase');

// Mock the database
jest.mock('objects/database');

// Mock the Entitlement class
jest.mock('discord.js', () => {
    const originalModule = jest.requireActual('discord.js');
    return {
        ...originalModule,
        Entitlement: jest.fn().mockImplementation((client, data) => {
            return {
                ...data,
                toJSON: jest.fn().mockReturnValue(data)
            };
        })
    };
});

// Mock the Purchasable class
jest.mock('objects/purchasable', () => {
    return jest.fn().mockImplementation(() => {
        return {
            load: jest.fn().mockResolvedValue(),
            isConsumable: jest.fn().mockResolvedValue(true),
            isSubscription: jest.fn().mockReturnValue(false),
            withSKU: jest.fn().mockReturnThis(), // Mock the withSKU method
            name: 'mock-name',
            skuId: 'mock-sku-id',
            type: 'mock-type'
        };
    });
});

my = {
    client: 'test-client',
    environment: 'test',
}

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
                consumed: false,
                entitlement: {
                    id: 'entitlement-123',
                    skuId: 'premium-1',
                    userId: 'user-123',
                    guildId: 'guild-123',
                    applicationId: 'app-123',
                    type: EntitlementType.GuildSubscription,
                    deleted: false,
                    startsTimestamp: '2024-03-20 12:00:00',
                    endsTimestamp: '2024-04-20 12:00:00',
                    consumed: false,
                    toJSON: jest.fn().mockReturnValue("entitlement")
                }
            };

            Database.prototype.get.mockResolvedValue(mockData);

            await purchase.load();

            expect(Database.prototype.get).toHaveBeenCalledWith('entitlements', 'test-id');
            expect(purchase.skuId).toBe(mockData.skuId);
            expect(purchase.userId).toBe(mockData.userId);
            expect(purchase.guildId).toBe(mockData.guildId);
            expect(purchase.type).toBe(mockData.type);
            expect(purchase.startDate).toEqual(new Date(mockData.start_timestamp));
            expect(purchase.endDate).toEqual(new Date(mockData.end_timestamp));
            expect(purchase.deleted).toBe(mockData.deleted);
            expect(purchase.consumed).toBe(mockData.consumed);
            expect(purchase.entitlement).toEqual(expect.objectContaining({
                id: mockData.entitlement.id,
                sku_id: mockData.entitlement.skuId,
                user_id: mockData.entitlement.userId,
                guild_id: mockData.entitlement.guildId,
                application_id: mockData.entitlement.applicationId,
                type: mockData.entitlement.type,
                deleted: mockData.entitlement.deleted,
                starts_timestamp: mockData.entitlement.startsTimestamp,
                ends_timestamp: mockData.entitlement.endsTimestamp,
                consumed: mockData.entitlement.consumed
            }));
            expect(purchase._loaded).toBe(true);
        });

        test('should handle non-existent purchase', async () => {
            Database.prototype.get.mockResolvedValue(null);

            await purchase.load();

            expect(Database.prototype.get).toHaveBeenCalledWith('entitlements', 'test-id');
            expect(purchase._loaded).toBe(false);
        });
    });

    describe('save', () => {
        test('should save purchase data to database', async () => {
            purchase.skuId = 'premium-1';
            purchase.userId = 'user-123';
            purchase.guildId = 'guild-123';
            purchase.type = EntitlementType.GuildSubscription;
            purchase.entitlement = {
                id: 'test-id',
                skuId: 'premium-1',
                userId: 'user-123',
                guildId: 'guild-123',
                type: EntitlementType.GuildSubscription,
                startsTimestamp: Date.now(),
                endsTimestamp: Date.now() + 1000000,
                deleted: false,
                consumed: false,
                toJSON: jest.fn().mockReturnValue({
                    id: 'test-id',
                    skuId: 'premium-1',
                    userId: 'user-123',
                    guildId: 'guild-123',
                    type: EntitlementType.GuildSubscription,
                    startsTimestamp: Date.now(),
                    endsTimestamp: Date.now() + 1000000,
                    deleted: false,
                    consumed: false
                })
            }

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
                userId: 'user-123',
                entitlement: {
                    id: 'test-id',
                    skuId: 'premium-1',
                    userId: 'user-123',
                    guildId: 'guild-123',
                    type: EntitlementType.GuildSubscription,
                    startsTimestamp: Date.now(),
                    endsTimestamp: Date.now() + 1000000,
                    deleted: false,
                    consumed: false
                }
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
                consumed: false,
                toJSON: jest.fn().mockReturnValue({
                    id: 'test-id',
                    skuId: 'premium-1',
                    userId: 'user-123',
                    guildId: 'guild-123',
                    type: EntitlementType.GuildSubscription,
                    startsTimestamp: Date.now(),
                    endsTimestamp: Date.now() + 1000000,
                    deleted: false,
                    consumed: false
                })
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
                consumed: false,
                toJSON: jest.fn().mockReturnValue({
                    id: 'test-id',
                    skuId: 'premium-1',
                    userId: 'user-123',
                    guildId: 'guild-123',
                    type: EntitlementType.GuildSubscription,
                    startsTimestamp: Date.now(),
                    endsTimestamp: null,
                    deleted: false,
                    consumed: false
                })
            };

            const result = await Purchase.withData(entitlement);

            expect(result.endDate).toBeNull();
        });

        test('should use current date when startsTimestamp is not provided', async () => {
            const entitlement = {
                toJSON: jest.fn().mockReturnValue({
                    id: 'test-id',
                    skuId: 'premium-1',
                    userId: 'user-123',
                    guildId: 'guild-123',
                    type: EntitlementType.GuildSubscription,
                    startsTimestamp: null,  // Explicitly null
                    endsTimestamp: null,
                    deleted: false,
                    consumed: false
                })
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