// set.test.js
const setCommand = require('commands/global/set');
const Server = require('objects/server');
const { PermissionsBitField } = require('discord.js');
const exp = require('constants');

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
            deferred: false,
            deferReply: jest.fn(),
            reply: jest.fn(),
            editReply: jest.fn(),
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

        // Mock console.log
        console.log = jest.fn();
    });

    test('Interaction is deferred', async () => {
        await setCommand.execute(interaction);

        expect(interaction.deferReply).toHaveBeenCalledWith({ ephemeral: true });
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

            expect(interaction.editReply).toHaveBeenCalledWith('Set dare_success XP to 50');
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

            expect(interaction.editReply).toHaveBeenCalledWith('Invalid subcommand');
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
            expect(interaction.editReply).toHaveBeenCalledWith('Announcements will be sent to <#channel-id>');
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
            expect(interaction.editReply).toHaveBeenCalledWith(
                'This is a premium command. Premium is not quite ready yet, But I\'m working hard to make these commands available for everyone :)'
            );
        });

        test('should handle insufficient channel permissions', async () => {
            interaction.options.getSubcommand.mockReturnValue('channel');
            interaction.options.getString.mockReturnValue('announcements');
            const mockChannel = {
                id: 'channel-id',
                guildId: 'test-guild-id',
                guild: {
                    members: {
                        me: {
                            permissionsIn: jest.fn().mockReturnValue({
                                has: jest.fn().mockReturnValue(false), // No permissions
                            }),
                        },
                    },
                },
            };
            interaction.options.getChannel.mockReturnValue(mockChannel);

            await setCommand.execute(interaction);

            expect(interaction.editReply).toHaveBeenCalledWith(
                'I need permission to view, send messages, and attach files in that channel'
            );
        });

        test('should set level-up channel when premium is active', async () => {
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
                send: jest.fn().mockResolvedValue()
            };
            interaction.options.getChannel.mockReturnValue(mockChannel);

            Server.mockImplementation(() => ({
                load: serverLoadMock,
                save: serverSaveMock,
                hasPremium: serverHasPremiumTrueMock,
                level_up_channel: null
            }));

            await setCommand.execute(interaction);

            expect(mockChannel.send).toHaveBeenCalledWith('Level up notifications will be sent here');
            expect(interaction.editReply).toHaveBeenCalledWith('Level up notifications will be sent to <#channel-id>');
        });

        test('should check channel permissions in setLevelUpChannel', async () => {
            interaction.options.getSubcommand.mockReturnValue('channel');
            interaction.options.getString.mockReturnValue('levelup');
            
            const mockChannel = {
                id: 'channel-id',
                guildId: 'test-guild-id',
                guild: {
                    members: {
                        me: {
                            permissionsIn: jest.fn().mockReturnValue({
                                has: jest.fn().mockReturnValue(false), // Missing permissions
                            }),
                        },
                    },
                },
            };
            interaction.options.getChannel.mockReturnValue(mockChannel);

            Server.mockImplementation(() => ({
                load: serverLoadMock,
                hasPremium: serverHasPremiumTrueMock,
                save: serverSaveMock
            }));

            await setCommand.execute(interaction);

            expect(interaction.editReply).toHaveBeenCalledWith(
                'I need permission to view, send messages, and attach files in that channel'
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
            expect(interaction.editReply).toHaveBeenCalledWith('Set dare_success XP to 50');
        });

        test('should reply with error when XP value is negative', async () => {
            interaction.options.getSubcommand.mockReturnValue('xp');
            interaction.options.getNumber.mockReturnValue(-10);

            await setCommand.execute(interaction);

            expect(interaction.editReply).toHaveBeenCalledWith('You cannot set negative XP');
        });
    });

    test('should handle insufficient role management permissions', async () => {
        interaction.options.getSubcommand.mockReturnValue('level-for-role');
        interaction.guild.members.me.permissions.has.mockReturnValue(false); // No manage roles permission
        
        // Mock the role object
        interaction.options.getRole.mockReturnValue({ id: 'test-role-id' });
        interaction.options.getNumber.mockReturnValue(10);

        Server.mockImplementation(() => ({
            load: serverLoadMock,
            hasPremium: serverHasPremiumTrueMock,
            setLevelRole: serverSetLevelRoleMock,
            save: serverSaveMock
        }));

        await setCommand.execute(interaction);

        expect(interaction.editReply).toHaveBeenCalledWith(
            'Unable to set the role to the level. I require the Manage Roles permission to give and take roles when players level up'
        );
    });

    test('should handle invalid channel event', async () => {
        // Mock console.log
        const originalConsoleLog = console.log;
        console.log = jest.fn();

        interaction.options.getSubcommand.mockReturnValue('channel');
        interaction.options.getString.mockReturnValue('invalid_event');
        
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
        };
        interaction.options.getChannel.mockReturnValue(mockChannel);

        await setCommand.execute(interaction);

        // Should log invalid event
        expect(console.log).toHaveBeenCalledWith('Invalid event invalid_event');

        // Restore original console.log
        console.log = originalConsoleLog;
    });

    describe('setLevelForRole function', () => {
        test('should successfully set level for role with proper permissions', async () => {
            interaction.options.getSubcommand.mockReturnValue('level-for-role');
            interaction.guild.members.me.permissions.has.mockReturnValue(true); // Has manage roles permission
            
            // Mock the role object
            interaction.options.getRole.mockReturnValue({ id: 'test-role-id' });
            interaction.options.getNumber.mockReturnValue(10);

            Server.mockImplementation(() => ({
                load: serverLoadMock,
                hasPremium: serverHasPremiumTrueMock,
                setLevelRole: serverSetLevelRoleMock,
                save: serverSaveMock
            }));

            await setCommand.execute(interaction);

            expect(serverSetLevelRoleMock).toHaveBeenCalledWith('test-role-id', 10);
            expect(serverSaveMock).toHaveBeenCalled();
            expect(interaction.editReply).toHaveBeenCalledWith('Set <@&test-role-id> to level 10');
        });

        test('should check required channel permissions until one fails', async () => {
            interaction.options.getSubcommand.mockReturnValue('channel');
            interaction.options.getString.mockReturnValue('announcements');
            
            const mockChannel = {
                id: 'channel-id',
                guildId: 'test-guild-id',
                guild: {
                    members: {
                        me: {
                            permissionsIn: jest.fn().mockReturnValue({
                                has: jest.fn()
                                    .mockReturnValueOnce(true)   // ViewChannel passes
                                    .mockReturnValueOnce(false)  // SendMessages fails
                            }),
                        },
                    },
                },
            };
            interaction.options.getChannel.mockReturnValue(mockChannel);

            await setCommand.execute(interaction);

            // Should check ViewChannel and SendMessages
            expect(mockChannel.guild.members.me.permissionsIn().has).toHaveBeenCalledWith('ViewChannel');
            expect(mockChannel.guild.members.me.permissionsIn().has).toHaveBeenCalledWith('SendMessages');
            // Should not check AttachFiles because SendMessages failed
            expect(mockChannel.guild.members.me.permissionsIn().has).toHaveBeenCalledTimes(2);
            
            expect(interaction.editReply).toHaveBeenCalledWith(
                'I need permission to view, send messages, and attach files in that channel'
            );
        });

        test('should handle premium check for level-for-role', async () => {
            interaction.options.getSubcommand.mockReturnValue('level-for-role');
            interaction.guild.members.me.permissions.has.mockReturnValue(true);
            interaction.options.getRole.mockReturnValue({ id: 'test-role-id' });
            interaction.options.getNumber.mockReturnValue(10);

            Server.mockImplementation(() => ({
                load: serverLoadMock,
                hasPremium: jest.fn().mockResolvedValue(false),
                save: serverSaveMock,
                setLevelRole: serverSetLevelRoleMock
            }));

            await setCommand.execute(interaction);

            expect(interaction.editReply).toHaveBeenCalledWith(
                "This is a premium command. Premium is not quite ready yet, But I'm working hard to make these commands available for everyone :)"
            );
        });

        test('should handle missing ManageRoles permission', async () => {
            interaction.options.getSubcommand.mockReturnValue('level-for-role');
            interaction.guild.members.me.permissions.has.mockReturnValue(false); // No ManageRoles permission
            interaction.options.getRole.mockReturnValue({ id: 'test-role-id' });
            interaction.options.getNumber.mockReturnValue(10);

            Server.mockImplementation(() => ({
                load: serverLoadMock,
                hasPremium: jest.fn().mockResolvedValue(true),
                save: serverSaveMock,
                setLevelRole: serverSetLevelRoleMock
            }));

            await setCommand.execute(interaction);

            expect(interaction.editReply).toHaveBeenCalledWith(
                "Unable to set the role to the level. I require the Manage Roles permission to give and take roles when players level up"
            );
        });
    });

    test('should verify all channel permissions when all pass', async () => {
        const mockChannel = {
            guild: {
                members: {
                    me: {
                        permissionsIn: jest.fn().mockReturnValue({
                            has: jest.fn()
                                .mockReturnValueOnce(true)  // ViewChannel
                                .mockReturnValueOnce(true)  // SendMessages
                                .mockReturnValueOnce(true)  // AttachFiles
                        }),
                    },
                },
            },
        };

        const result = setCommand.hasPermission(mockChannel);

        expect(result).toBe(true);
        expect(mockChannel.guild.members.me.permissionsIn().has).toHaveBeenCalledWith('ViewChannel');
        expect(mockChannel.guild.members.me.permissionsIn().has).toHaveBeenCalledWith('SendMessages');
        expect(mockChannel.guild.members.me.permissionsIn().has).toHaveBeenCalledWith('AttachFiles');
    });

    test('should not defer reply when interaction is already deferred', async () => {
        // Set interaction as already deferred
        interaction.deferred = true;

        await setCommand.execute(interaction);

        // Verify deferReply was not called
        expect(interaction.deferReply).not.toHaveBeenCalled();
    });
});
