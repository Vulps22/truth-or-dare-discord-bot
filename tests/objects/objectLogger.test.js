const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Logger = require('objects/logger');
const { applyGlobals } = require("tests/setuptest.js");

// Mock Discord.js classes
jest.mock('discord.js', () => ({
    EmbedBuilder: jest.fn().mockImplementation(() => ({
        setTitle: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        addFields: jest.fn().mockReturnThis(),
        setFooter: jest.fn().mockReturnThis(),
        setTimestamp: jest.fn().mockReturnThis(),
        data: {
            title: '',
            fields: []
        }
    })),
    ActionRowBuilder: jest.fn().mockImplementation(() => ({
        addComponents: jest.fn(function(...components) {
            this.components = components;
            return this;
        }),
        components: []
    })),
    ButtonBuilder: jest.fn().mockImplementation(() => {
        const state = {
            custom_id: '',
            label: '',
            style: 1,
            disabled: false
        };
        return {
            setCustomId: jest.fn(function(id) {
                state.custom_id = id;
                return this;
            }),
            setLabel: jest.fn(function(label) {
                state.label = label;
                return this;
            }),
            setStyle: jest.fn(function(style) {
                state.style = style;
                return this;
            }),
            setDisabled: jest.fn(function(disabled) {
                state.disabled = disabled;
                return this;
            }),
            data: state
        };
    }),
    ButtonStyle: {
        Primary: 1,
        Secondary: 2,
        Success: 3,
        Danger: 4
    }
}));

// Mock the global client with sharding capability
global.client = {
    shard: {
        broadcastEval: jest.fn()
    }
};

describe('Logger', () => {
    let mockDare;
    let mockTruth;

    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();

        // Setup global config
        global.my = {
            logs: 'logs_channel',
            dares_log: 'dares_channel',
            truths_log: 'truths_channel',
            servers_log: 'servers_channel',
            errors_log: 'errors_channel',
            banned_users_log: 'banned_users_channel',
            reports_log: 'reports_channel'
        };

        // Setup default broadcast response
        global.client.shard.broadcastEval.mockResolvedValue(['message_id']);

        mockDare = {
            type: 'dare',
            question: 'Test dare question',
            creator: '123456',
            getCreatorUsername: jest.fn().mockResolvedValue('TestUser'),
            getApprovedByUser: jest.fn().mockResolvedValue({ username: 'Approver' }),
            getBannedByUser: jest.fn().mockResolvedValue({ username: 'Moderator' }),
            server: { name: 'Test Server' },
            id: '1',
            isApproved: false,
            isBanned: false,
            banReason: '',
            messageId: null,
            save: jest.fn().mockResolvedValue(true)
        };

        mockTruth = { ...mockDare, type: 'truth' };

        // Mock createActionRow function
        global.createActionRow = jest.fn().mockReturnValue({
            addComponents: jest.fn().mockReturnThis()
        });
    });

    describe('log', () => {
        test('successfully logs a message', async () => {
            const messageId = await Logger.log('Test message');
            
            expect(global.client.shard.broadcastEval).toHaveBeenCalled();
            expect(messageId).toBe('message_id');
            expect(console.log).toHaveBeenCalledWith('message_id');
        });

        test('handles failed message logging', async () => {
            global.client.shard.broadcastEval.mockResolvedValue([false]);
            
            const messageId = await Logger.log('Test message');
            
            expect(messageId).toBeNull();
            expect(console.log).toHaveBeenCalledWith('Failed to log the message.');
        });

        test('handles errors', async () => {
            const testError = new Error('Test error');
            global.client.shard.broadcastEval.mockRejectedValue(testError);
            
            const messageId = await Logger.log('Test message');
            
            expect(messageId).toBeNull();
            expect(console.log).toHaveBeenCalledWith('Failed to log the message.');
        });
    });

    describe('editLog', () => {
        test('successfully edits log message', async () => {
            global.client.shard.broadcastEval.mockResolvedValue([true]);
            
            await Logger.editLog('message_id', 'Updated content');
            
            expect(console.log).toHaveBeenCalledWith('Log message updated: Updated content');
        });

        test('handles failed log edit', async () => {
            global.client.shard.broadcastEval.mockResolvedValue([false]);
            
            await Logger.editLog('message_id', 'Updated content');
            
            expect(console.log).toHaveBeenCalledWith('Failed to update log message with ID: message_id');
        });

        test('handles errors during log edit', async () => {
            const testError = new Error('Test error');
            global.client.shard.broadcastEval.mockRejectedValue(testError);
            
            await Logger.editLog('message_id', 'Updated content');
            
            expect(console.log).toHaveBeenCalledWith('Failed to update log message with ID: message_id');
        });
    });

    describe('error', () => {
        test('successfully logs error message', async () => {
            global.client.shard.broadcastEval.mockResolvedValue(['error_message_id']);
            
            await Logger.error('Test error message');
            
            expect(console.log).toHaveBeenCalledWith('Error message logged with ID: error_message_id');
            expect(console.error).toHaveBeenCalledWith('Test error message');
        });

        test('handles failed error logging', async () => {
            global.client.shard.broadcastEval.mockResolvedValue([false]);
            
            await Logger.error('Test error message');
            
            expect(console.log).toHaveBeenCalledWith('Failed to log the error message.');
        });

        test('handles errors during error logging', async () => {
            const testError = new Error('Test error');
            global.client.shard.broadcastEval.mockRejectedValue(testError);
            
            await Logger.error('Test error message');
            
            expect(console.log).toHaveBeenCalledWith('Failed to log the error message.');
        });
    });

    describe('newDare', () => {
        test('successfully logs new dare', async () => {
            await Logger.newDare(mockDare);

            expect(global.client.shard.broadcastEval).toHaveBeenCalled();
            expect(mockDare.messageId).toBe('message_id');
            expect(mockDare.save).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('Logged:', 'message_id');
        });

        test('handles failed dare logging', async () => {
            global.client.shard.broadcastEval.mockResolvedValue([false]);

            await Logger.newDare(mockDare);

            expect(mockDare.save).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('Failed to log the dare message.');
        });
    });

    describe('updateDare', () => {
        test('successfully updates dare', async () => {
            mockDare.messageId = 'existing_message_id';
            global.client.shard.broadcastEval.mockResolvedValue([true]);

            const result = await Logger.updateDare(mockDare);

            expect(result).toBe(true);
            expect(console.log).toHaveBeenCalledWith('Updated message with ID:', 'existing_message_id');
        });

        test('skips update for pre-v5 dares', async () => {
            mockDare.messageId = 'pre-v5';

            const result = await Logger.updateDare(mockDare);

            expect(result).toBeUndefined();
            expect(global.client.shard.broadcastEval).not.toHaveBeenCalled();
        });

        test('handles user ban parameter', async () => {
            mockDare.messageId = 'existing_message_id';
            mockDare.isBanned = true;
            mockDare.banReason = 'Inappropriate content';

            await Logger.updateDare(mockDare, true);

            expect(global.client.shard.broadcastEval).toHaveBeenCalled();
            expect(mockDare.getBannedByUser).toHaveBeenCalled();
        });
    });

    describe('getDareEmbed', () => {
        test('creates embed for pre-v5 dare', async () => {
            const mockDare = {
                type: 'dare',
                question: 'Test dare',
                creator: '123',
                getCreatorUsername: jest.fn().mockResolvedValue('TestUser'),
                server: null,
                id: '1',
                isApproved: false,
                isBanned: false
            };

            const embed = await Logger.getDareEmbed(mockDare);

            expect(EmbedBuilder).toHaveBeenCalled();
            expect(embed.setTitle).toHaveBeenCalledWith('New Dare');
            expect(embed.addFields).toHaveBeenCalledWith(
                { name: 'Question', value: 'Test dare' },
                { name: 'Author Name', value: 'TestUser | 123' },
                { name: 'Server:', value: 'Pre-V5' }
            );
        });
    });

    describe('newTruth', () => {
        test('successfully logs new truth', async () => {
            await Logger.newTruth(mockTruth);

            expect(global.client.shard.broadcastEval).toHaveBeenCalled();
            expect(mockTruth.messageId).toBe('message_id');
            expect(mockTruth.save).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('Logged message with ID:', 'message_id');
        });

        test('handles failed truth logging', async () => {
            global.client.shard.broadcastEval.mockResolvedValue([false]);

            await Logger.newTruth(mockTruth);

            expect(mockTruth.save).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('Failed to log the truth message.');
        });

        test('handles errors during truth logging', async () => {
            const testError = new Error('Test error');
            global.client.shard.broadcastEval.mockRejectedValue(testError);

            await Logger.newTruth(mockTruth);

            expect(console.log).toHaveBeenCalledWith('Failed to log the truth message.');
        });
    });

    describe('updateTruth', () => {
        test('successfully updates truth', async () => {
            mockTruth.messageId = 'existing_message_id';
            global.client.shard.broadcastEval.mockResolvedValue([true]);

            const result = await Logger.updateTruth(mockTruth);

            expect(result).toBe(true);
            expect(console.log).toHaveBeenCalledWith('Updated message with ID:', 'existing_message_id');
        });

        test('skips update for pre-v5 truths', async () => {
            mockTruth.messageId = 'pre-v5';

            const result = await Logger.updateTruth(mockTruth);

            expect(result).toBeUndefined();
            expect(global.client.shard.broadcastEval).not.toHaveBeenCalled();
        });

        test('handles banned truth with user ban', async () => {
            mockTruth.messageId = 'existing_message_id';
            mockTruth.isBanned = true;
            mockTruth.banReason = 'Inappropriate content';

            await Logger.updateTruth(mockTruth, true);

            expect(global.client.shard.broadcastEval).toHaveBeenCalled();
            expect(mockTruth.getBannedByUser).toHaveBeenCalled();
        });
    });

    describe('bannedUser', () => {
        test('successfully logs banned user', async () => {
            const mockUser = {
                id: '12345',
                username: 'TestUser',
                banReason: 'Violation of terms',
                save: jest.fn().mockResolvedValue(true)
            };

            await Logger.bannedUser(mockUser, 5, 2);

            expect(global.client.shard.broadcastEval).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('Banned user message logged with ID:', 'message_id');
        });

        test('handles failed banned user logging', async () => {
            global.client.shard.broadcastEval.mockResolvedValue([false]);
            const mockUser = {
                id: '12345',
                username: 'TestUser',
                banReason: 'Violation of terms',
                save: jest.fn().mockResolvedValue(true)
            };

            await Logger.bannedUser(mockUser, 5, 2);

            expect(console.log).toHaveBeenCalledWith('Failed to log the banned user message.');
        });
    });

    describe('newServer', () => {
        let mockServer;

        beforeEach(() => {
            mockServer = {
                id: '12345',
                name: 'Test Server',
                acceptedString: jest.fn().mockReturnValue('Yes'),
                bannedString: jest.fn().mockReturnValue('No'),
                banReason: null,
                save: jest.fn().mockResolvedValue(true)
            };
        });

        test('successfully logs new server', async () => {
            await Logger.newServer(mockServer);

            expect(global.client.shard.broadcastEval).toHaveBeenCalled();
            expect(mockServer.save).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('Server message logged with ID:', 'message_id');
        });

        test('handles failed server logging', async () => {
            global.client.shard.broadcastEval.mockResolvedValue([false]);

            await Logger.newServer(mockServer);

            expect(mockServer.save).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('Failed to log the server message.');
        });

        test('handles errors during server logging', async () => {
            const testError = new Error('Test error');
            global.client.shard.broadcastEval.mockRejectedValue(testError);

            await Logger.newServer(mockServer);

            expect(console.log).toHaveBeenCalledWith('Failed to log the server message.');
        });
    });

    describe('updateServer', () => {
        let mockServer;

        beforeEach(() => {
            mockServer = {
                id: '12345',
                name: 'Test Server',
                acceptedString: jest.fn().mockReturnValue('Yes'),
                bannedString: jest.fn().mockReturnValue('No'),
                banReason: null,
                message_id: 'existing_message_id',
                _loaded: true,
                owner: {
                    id: '67890',
                    username: 'TestOwner'
                }
            };

            // Mock the channel message editing
            global.client.shard.broadcastEval.mockImplementation(async (fn, { context }) => {
                const mockClient = {
                    channels: {
                        cache: new Map([
                            [context.channelId, {
                                messages: {
                                    cache: new Map([
                                        [context.messageId, {
                                            edit: jest.fn().mockResolvedValue(true)
                                        }]
                                    ])
                                }
                            }]
                        ])
                    }
                };
                
                // Call the function with our mock client
                const result = await fn(mockClient, context);
                return [result]; // Wrap in array to simulate shard response
            });
        });

        test('successfully updates server', async () => {
            const result = await Logger.updateServer(mockServer);

            expect(result).toBe(true);
            expect(console.log).toHaveBeenCalledWith('Updated server message with ID:', 'existing_message_id');
        });

        test('handles banned server', async () => {
            mockServer.bannedString = jest.fn().mockReturnValue('Yes');
            mockServer.banReason = 'TOS Violation';

            await Logger.updateServer(mockServer);

            expect(global.client.shard.broadcastEval).toHaveBeenCalled();
        });
    });

    describe('newReport', () => {
        let mockReport;

        beforeEach(() => {
            mockReport = {
                type: 'dare',
                reason: 'Inappropriate content',
                offender: {
                    id: '67890',
                    question: 'Test question'  // for dare/truth reports
                    // name: 'Test Server'     // would be used for server reports
                }
            };
        });

        test('successfully logs dare/truth report', async () => {
            await Logger.newReport(mockReport);

            expect(global.client.shard.broadcastEval).toHaveBeenCalled();
            expect(console.log).not.toHaveBeenCalled();  // Success case doesn't log
        });

        test('successfully logs server report', async () => {
            mockReport.type = 'server';
            mockReport.offender = {
                id: '67890',
                name: 'Test Server'
            };

            await Logger.newReport(mockReport);

            expect(global.client.shard.broadcastEval).toHaveBeenCalled();
        });

        test('handles errors during report logging', async () => {
            const testError = new Error('Test error');
            global.client.shard.broadcastEval.mockRejectedValue(testError);

            await Logger.newReport(mockReport);

            expect(console.error).toHaveBeenCalledWith('Failed to send message to channel reports_channel:', testError);
        });
    });

    describe('deleteServer', () => {
        test('successfully deletes server message', async () => {
            global.client.shard.broadcastEval.mockResolvedValue([true]);
            
            await Logger.deleteServer('server_message_id');
            
            expect(console.log).toHaveBeenCalledWith('Server deleted from log.');
        });

        test('handles failed server message deletion', async () => {
            global.client.shard.broadcastEval.mockResolvedValue([false]);
            
            await Logger.deleteServer('server_message_id');
            
            expect(console.log).toHaveBeenCalledWith('Failed to delete server message.');
        });

        test('handles errors during server deletion', async () => {
            const testError = new Error('Test error');
            global.client.shard.broadcastEval.mockRejectedValue(testError);
            
            await Logger.deleteServer('server_message_id');
            
            expect(console.log).toHaveBeenCalledWith('Error deleting server message:', testError);
        });
    });

    describe('createReportActionRow', () => {
        beforeEach(() => {
            // Mock Discord.js classes
            jest.mock('discord.js', () => ({
                ActionRowBuilder: jest.fn().mockReturnValue({
                    addComponents: jest.fn().mockReturnThis(),
                    components: []
                }),
                ButtonBuilder: jest.fn().mockReturnValue({
                    setCustomId: jest.fn().mockReturnThis(),
                    setLabel: jest.fn().mockReturnThis(),
                    setStyle: jest.fn().mockReturnThis(),
                    setDisabled: jest.fn().mockReturnThis(),
                    data: {
                        custom_id: '',
                        disabled: false
                    }
                }),
                ButtonStyle: {
                    Success: 1,
                    Danger: 4,
                    Secondary: 2,
                    Primary: 3
                }
            }));
        });

        test('creates report action row with correct buttons', () => {
            const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
            const actionRow = Logger.createReportActionRow();
            
            expect(ActionRowBuilder).toHaveBeenCalled();
            expect(ButtonBuilder).toHaveBeenCalledTimes(3);
        });
    });

    describe('getActionRow', () => {
        beforeEach(() => {
            // Create a spy on the createActionRow method
            jest.spyOn(Logger, 'createActionRow');
        });

        afterEach(() => {
            // Clear the spy after each test
            jest.restoreAllMocks();
        });

        test('returns action row for non-banned dare', () => {
            const actionRow = Logger.getActionRow('dare', false, false);
            
            expect(actionRow).toBeDefined();
            expect(Logger.createActionRow).toHaveBeenCalledWith('dare', false, false);
        });

        test('returns action row for banned server', () => {
            const actionRow = Logger.getActionRow('server', true, false);
            
            expect(actionRow).toBeDefined();
            expect(Logger.createActionRow).toHaveBeenCalledWith('server', true, false);
        });
    });

    describe('questionEmbed', () => {
        let mockQuestion;
        let mockEmbed;

        beforeEach(() => {
            // Reset mocks
            jest.clearAllMocks();

            mockQuestion = {
                type: 'dare',
                question: 'Test question',
                creator: '12345',
                server: { name: 'Test Server' },
                id: '67890',
                isApproved: false,
                isBanned: false,
                getCreatorUsername: jest.fn().mockResolvedValue('TestUser'),
                getApprovedByUser: jest.fn().mockResolvedValue({ username: 'ApproverUser' }),
                getBannedByUser: jest.fn().mockResolvedValue({ username: 'BannerUser' })
            };

            // Setup EmbedBuilder mock to track fields
            mockEmbed = {
                setTitle: jest.fn().mockReturnThis(),
                addFields: jest.fn().mockReturnThis(),
                setFooter: jest.fn().mockReturnThis(),
                data: {
                    title: 'New Dare',
                    fields: []
                }
            };
            EmbedBuilder.mockReturnValue(mockEmbed);
        });

        test('creates basic question embed', async () => {
            const embed = await Logger.questionEmbed(mockQuestion);
            
            expect(mockEmbed.addFields).toHaveBeenCalledWith(
                { name: 'Question', value: 'Test question' },
                expect.any(Object),  // Author Name field
                expect.any(Object)   // Server field
            );
        });

        test('includes approval information when question is approved', async () => {
            mockQuestion.isApproved = true;
            
            const embed = await Logger.questionEmbed(mockQuestion);
            
            expect(mockEmbed.addFields).toHaveBeenCalledWith(
                expect.objectContaining({ 
                    name: 'Approved By:',
                    value: 'ApproverUser'
                })
            );
        });

        test('includes ban information when question is banned', async () => {
            mockQuestion.isBanned = true;
            mockQuestion.banReason = 'Inappropriate content';
            
            await Logger.questionEmbed(mockQuestion);
            
            // Verify the second call to addFields includes ban information
            const calls = mockEmbed.addFields.mock.calls;
            expect(calls[1][0]).toEqual(
                expect.objectContaining({ 
                    name: 'Banned:',
                    value: 'YES'
                })
            );
        });

        test('handles missing banned by user', async () => {
            mockQuestion.isBanned = true;
            mockQuestion.getBannedByUser.mockResolvedValue(null);
            
            const embed = await Logger.questionEmbed(mockQuestion);
            
            expect(mockEmbed.addFields).not.toHaveBeenCalledWith(
                expect.objectContaining({ 
                    name: 'Banned By:'
                })
            );
        });
    });

    describe('createActionRow', () => {
        let mockButton;

        beforeEach(() => {
            mockButton = {
                setCustomId: jest.fn().mockReturnThis(),
                setLabel: jest.fn().mockReturnThis(),
                setStyle: jest.fn().mockReturnThis(),
                setDisabled: jest.fn().mockReturnThis()
            };
            ButtonBuilder.mockReturnValue(mockButton);
        });

        test('creates action row for banned server with banned owner', () => {
            const actionRow = Logger.createActionRow('server', true, true);
            
            // Verify the Banned button setup
            expect(mockButton.setCustomId).toHaveBeenCalledWith('new_server_ban');
            expect(mockButton.setLabel).toHaveBeenCalledWith('Banned');
            expect(mockButton.setStyle).toHaveBeenCalledWith(ButtonStyle.Danger);
            expect(mockButton.setDisabled).toHaveBeenCalledWith(true);

            // Verify the Unban button setup
            expect(mockButton.setCustomId).toHaveBeenCalledWith('new_server_unban');
            expect(mockButton.setLabel).toHaveBeenCalledWith('Unban');
            expect(mockButton.setStyle).toHaveBeenCalledWith(ButtonStyle.Primary);

            // Verify the Ban Owner button setup
            expect(mockButton.setCustomId).toHaveBeenCalledWith('user_server_ban');
            expect(mockButton.setLabel).toHaveBeenCalledWith('Creator is Banned');
            expect(mockButton.setDisabled).toHaveBeenCalledWith(true);
        });
    });
});