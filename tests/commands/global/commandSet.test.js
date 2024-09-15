// set.test.js
const setCommand = require('commands/global/set');
const Server = require('objects/server');
const { PermissionsBitField } = require('discord.js');

jest.mock('objects/server');

// Define constants for predefined mock functions
const serverHasPremiumTrueMock = jest.fn().mockResolvedValue(true);
const serverHasPremiumFalseMock = jest.fn().mockResolvedValue(false);
const serverLoadMock = jest.fn().mockResolvedValue();
const serverSaveMock = jest.fn().mockResolvedValue();
const serverSetLevelRoleMock = jest.fn().mockResolvedValue();
const serverSetXpRateMock = jest.fn().mockResolvedValue();
const serverGetEntitlementEndDateMock = jest.fn().mockResolvedValue();
const serverGetLevelRoleMock = jest.fn().mockResolvedValue();

// Define a clear function to reset all mocks
const clearMocks = () => {
    serverHasPremiumTrueMock.mockClear();
    serverHasPremiumFalseMock.mockClear();
    serverLoadMock.mockClear();
    serverSaveMock.mockClear();
    serverSetLevelRoleMock.mockClear();
    serverSetXpRateMock.mockClear();
    serverGetEntitlementEndDateMock.mockClear();
    serverGetLevelRoleMock.mockClear();
};

describe('set command', () => {
    let interaction;

    beforeEach(() => {
        interaction = {
            options: {
                getSubcommand: jest.fn(),
                getString: jest.fn(),
                getChannel: jest.fn(),
                getNumber: jest.fn(),
                getRole: jest.fn(),
            },
            guildId: 'test-guild-id',
            reply: jest.fn(),
            guild: {
                members: {
                    me: {
                        permissionsIn: jest.fn(),
                        permissions: {
                            has: jest.fn(),
                        },
                    },
                },
            },
        };
        clearMocks(); // Clear mocks before each test
    });

    describe('execute function', () => {

        test('should call setXP when subcommand is "xp"', async () => {
            interaction.options.getSubcommand.mockReturnValue('xp');
            interaction.options.getString.mockReturnValue('dare_success');
            interaction.options.getNumber.mockReturnValue(50);

            Server.mockImplementation(() => {
                return {
                    load: serverLoadMock,
                    setXpRate: serverSetXpRateMock,
                    save: serverSaveMock,
                    hasPremium: serverHasPremiumTrueMock,
                }
            });

            await setCommand.execute(interaction);

            expect(interaction.options.getSubcommand).toHaveBeenCalled();
            expect(serverLoadMock).toHaveBeenCalled();
            expect(serverSetXpRateMock).toHaveBeenCalledWith('dare_success', 50);
            expect(serverSaveMock).toHaveBeenCalled();
            expect(interaction.reply).toHaveBeenCalledWith('Set dare_success XP to 50');
        });

        test('should call setLevelForRole when subcommand is "level-for-role"', async () => {
            interaction.options.getSubcommand.mockReturnValue('level-for-role');
            interaction.options.getRole.mockReturnValue({ id: 'role-id' });
            interaction.options.getNumber.mockReturnValue(10);

            // Inject the premium server mock
            Server.mockImplementation(() => {
                return {
                    load: serverLoadMock,
                    setLevelRole: serverSetLevelRoleMock,
                    save: serverSaveMock,
                    hasPremium: serverHasPremiumTrueMock,
                }
            });
            await setCommand.execute(interaction);

            expect(interaction.options.getSubcommand).toHaveBeenCalled();
            expect(interaction.options.getRole).toHaveBeenCalled();
            expect(serverSetLevelRoleMock).toHaveBeenCalledWith('role-id', 10);
            expect(serverSaveMock).toHaveBeenCalled();
        });

        test('should reply "Invalid subcommand" when subcommand is invalid', async () => {
            interaction.options.getSubcommand.mockReturnValue('invalid');

            await setCommand.execute(interaction);

            expect(interaction.reply).toHaveBeenCalledWith('Invalid subcommand');
        });
    });

    describe('setChannel function', () => {

        test('should set announcement channel when event is "announcements"', async () => {
            interaction.options.getSubcommand.mockReturnValue('channel');
            interaction.options.getString.mockReturnValue('announcements');
            const mockChannel = {
                id: 'channel-id',
                guildId: 'test-guild-id',
                guild: {
                    members: {
                        me: {
                            permissionsIn: jest.fn().mockReturnValue({
                                has: jest.fn().mockReturnValue(true),
                            }),
                        },
                    },
                },
                send: jest.fn(),
            };

            interaction.options.getChannel.mockReturnValue(mockChannel);

            // Inject the premium server mock
            Server.mockImplementation(() => {
                return {
                    load: serverLoadMock,
                    setXP: serverSetXpRateMock,
                    save: serverSaveMock,
                    hasPremium: serverHasPremiumTrueMock,
                }
            });

            await setCommand.execute(interaction);
            expect(serverLoadMock).toHaveBeenCalled();
            expect(serverSaveMock).toHaveBeenCalled();
            expect(mockChannel.send).toHaveBeenCalledWith('Announcements will be sent here');
            expect(interaction.reply).toHaveBeenCalledWith('Announcements will be sent to <#channel-id>');
        });

        test('should reply with premium message when setting level-up channel without premium', async () => {
            interaction.options.getSubcommand.mockReturnValue('channel');
            interaction.options.getString.mockReturnValue('levelup');
            const mockChannel = {
                id: 'channel-id',
                guildId: 'test-guild-id',
                guild: {
                    members: {
                        me: {
                            permissionsIn: jest.fn().mockReturnValue({
                                has: jest.fn().mockReturnValue(true),
                            }),
                        },
                    },
                },
                send: jest.fn(),
            };
            interaction.options.getChannel.mockReturnValue(mockChannel);

            // Inject the server mock without premium
            Server.mockImplementation(() => {
                return {
                    load: serverLoadMock,
                    setXP: serverSetXpRateMock,
                    save: serverSaveMock,
                    hasPremium: serverHasPremiumFalseMock,
                }
            });
            await setCommand.execute(interaction);

            expect(serverHasPremiumFalseMock).toHaveBeenCalled();
            expect(interaction.reply).toHaveBeenCalledWith(
                'This is a premium command. Premium is not quite ready yet, But I\'m working hard to make these commands available for everyone :)'
            );
        });
    });

    describe('setXP function', () => {

        test('should set XP rate when amount is valid', async () => {
            interaction.options.getSubcommand.mockReturnValue('xp');
            interaction.options.getString.mockReturnValue('dare_success');
            interaction.options.getNumber.mockReturnValue(50);

            // Inject the premium server mock
            Server.mockImplementation(() => {
                return {
                    load: serverLoadMock,
                    setXpRate: serverSetXpRateMock,
                    save: serverSaveMock,
                    hasPremium: serverHasPremiumTrueMock,
                }
            });

            await setCommand.execute(interaction);

            expect(serverLoadMock).toHaveBeenCalled();
            expect(serverSetXpRateMock).toHaveBeenCalledWith('dare_success', 50);
            expect(serverSaveMock).toHaveBeenCalled();
            expect(interaction.reply).toHaveBeenCalledWith('Set dare_success XP to 50');
        });

        test('should reply with error when XP value is negative', async () => {
            interaction.options.getSubcommand.mockReturnValue('xp');
            interaction.options.getNumber.mockReturnValue(-10);

            await setCommand.execute(interaction);

            expect(interaction.reply).toHaveBeenCalledWith('You cannot set negative XP');
        });
    });
});
