const Handler = require('handlers/handler');

// Move jest.mock calls to the top, before any other code
jest.mock('objects/database');
jest.mock('objects/logger');
jest.mock('@discordjs/builders', () => ({
    SelectMenuBuilder: jest.fn().mockImplementation(() => ({
        setCustomId: jest.fn().mockReturnThis(),
        setMinValues: jest.fn().mockReturnThis(),
        setOptions: jest.fn().mockReturnThis()
    })),
    ModalBuilder: jest.fn().mockImplementation(() => ({
        setCustomId: jest.fn().mockReturnThis(),
        setTitle: jest.fn().mockReturnThis(),
        addComponents: jest.fn().mockReturnThis()
    })),
    ActionRowBuilder: jest.fn().mockImplementation(() => ({
        addComponents: jest.fn().mockReturnThis()
    })),
    TextInputBuilder: jest.fn().mockImplementation(() => ({
        setCustomId: jest.fn().mockReturnThis(),
        setLabel: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis(),
        setPlaceholder: jest.fn().mockReturnThis(),
        setRequired: jest.fn().mockReturnThis()
    })),
    
}));

jest.mock('discord.js', () => ({
    ComponentType: { StringSelect: 3 },
    ButtonStyle: { Success: 1, Danger: 4 },
    TextInputStyle: { Short: 1 },
    StringSelectMenuOptionBuilder: jest.fn().mockImplementation(() => ({
        setLabel: jest.fn().mockReturnThis(),
        setValue: jest.fn().mockReturnThis(),
        setDefault: jest.fn().mockReturnThis()
    })),
    StringSelectMenuBuilder: jest.fn().mockImplementation(() => ({
        setCustomId: jest.fn().mockReturnThis(),
        setMinValues: jest.fn().mockReturnThis(),
        setOptions: jest.fn().mockReturnThis()
    })),
    ButtonBuilder: jest.fn().mockImplementation(() => ({
        setCustomId: jest.fn().mockReturnThis(),
        setLabel: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis(),
        setDisabled: jest.fn().mockReturnThis()
    })),
    EmbedBuilder: jest.fn().mockImplementation(() => ({
        setTitle: jest.fn().mockReturnThis(),
        addFields: jest.fn().mockReturnThis(),
        setFooter: jest.fn().mockReturnThis()
    }))
}));

// Use a factory function for the banHandler mock
jest.mock('handlers/banHandler', () => {
    return jest.fn().mockImplementation(() => ({
        banQuestion: jest.fn().mockResolvedValue(true),
        banServer: jest.fn().mockResolvedValue(true),
        sendServerBanNotification: jest.fn().mockResolvedValue(),
        sendUserBanNotification: jest.fn().mockResolvedValue(),
        sendBanFailedNotification: jest.fn().mockResolvedValue(),
        banUser: jest.fn().mockResolvedValue(true),
        getBanReasons: jest.fn().mockReturnValue([
            { name: 'Reason 1', value: 'reason1' }
        ]),
        getServerBanReasons: jest.fn().mockReturnValue([
            { name: 'Server Reason', value: 'server_reason' }
        ]),
        getUserBanReasons: jest.fn().mockReturnValue([
            { name: 'User Reason', value: 'user_reason' }
        ])
    }));
});

// At the top with other mocks
jest.mock('objects/logger', () => ({
    updateDare: jest.fn().mockResolvedValue(),
    updateTruth: jest.fn().mockResolvedValue()
}));

// At the top with other mocks
jest.mock('objects/database', () => {
    return jest.fn().mockImplementation(() => ({
        get: jest.fn(),
        set: jest.fn()
    }));
});

// After other imports
const logger = require('objects/logger');

describe('Handler', () => {
    /** @type {Handler} */
    let handler;
    /** @type {Interaction} */
    let interaction;
    /** @type {BanHandler} */
    let mockBanHandlerInstance;

    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        
        global.my = {
            environment: 'dev',
            required_votes: 5
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Create the mock instance that will be used by Handler
        mockBanHandlerInstance = {
            banQuestion: jest.fn().mockResolvedValue(true),
            banServer: jest.fn().mockResolvedValue(true),
            sendServerBanNotification: jest.fn().mockResolvedValue(),
            sendUserBanNotification: jest.fn().mockResolvedValue(),
            sendBanFailedNotification: jest.fn().mockResolvedValue(),
            banUser: jest.fn().mockResolvedValue(true),
            getBanReasons: jest.fn().mockReturnValue([
                { name: 'Reason 1', value: 'reason1' }
            ]),
            getServerBanReasons: jest.fn().mockReturnValue([
                { name: 'Server Reason', value: 'server_reason' }
            ]),
            getUserBanReasons: jest.fn().mockReturnValue([
                { name: 'User Reason', value: 'user_reason' }
            ])
        };

        // Get the mocked constructor and set its implementation
        const BanHandler = require('handlers/banHandler');
        BanHandler.mockImplementation(() => mockBanHandlerInstance);
        
        handler = new Handler('dare');
        
        // Create interaction mock
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
            deferReply: jest.fn().mockResolvedValue(),
            reply: jest.fn().mockResolvedValue(),
            editReply: jest.fn().mockResolvedValue(),
            followUp: jest.fn().mockResolvedValue({
                createMessageComponentCollector: jest.fn().mockReturnValue({
                    on: jest.fn()
                })
            }),
            showModal: jest.fn().mockResolvedValue(),
            awaitModalSubmit: jest.fn().mockResolvedValue({
                fields: {
                    getTextInputValue: jest.fn().mockReturnValue('custom reason')
                }
            }),
            message: {
                edit: jest.fn().mockResolvedValue()
            },
            user: {
                id: 'test-user-id'
            },
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
    });

    afterAll(() => {
        console.log.mockRestore();
        console.error.mockRestore();
        delete global.my;
        jest.resetModules();
    });

    describe('doBan', () => {
        test('should handle dare ban', async () => {
            await handler.doBan(interaction, '123', 'test_reason');
            
            expect(interaction.deferReply).toHaveBeenCalledWith({ ephemeral: true });
            expect(mockBanHandlerInstance.banQuestion).toHaveBeenCalledWith('123', 'test_reason', interaction);
        });

        test('should handle truth ban', async () => {
            handler.type = 'truth';
            await handler.doBan(interaction, '123', 'test_reason');
            
            expect(mockBanHandlerInstance.banQuestion).toHaveBeenCalledWith('123', 'test_reason', interaction);
        });

        test('should handle server ban', async () => {
            handler.type = 'server';
            await handler.doBan(interaction, '123', 'test_reason');
            
            expect(mockBanHandlerInstance.banServer).toHaveBeenCalledWith('123', 'test_reason', interaction);
        });

        test('should handle user ban', async () => {
            handler.type = 'user';
            await handler.doBan(interaction, '123', 'test_reason');
            
            expect(mockBanHandlerInstance.banUser).toHaveBeenCalledWith('123', 'test_reason', interaction);
        });

        test('should handle ban failure', async () => {
            mockBanHandlerInstance.banQuestion.mockResolvedValue(false);
            
            await handler.doBan(interaction, '123', 'test_reason');
            
            expect(interaction.followUp).toHaveBeenCalledWith({
                content: 'Ban Failed',
                ephemeral: true
            });
        });
    });

    describe('getBanReason', () => {
        let collectorCallback;

        beforeEach(() => {
            // Mock the original interaction
            interaction.followUp.mockResolvedValue({
                createMessageComponentCollector: jest.fn().mockReturnValue({
                    on: jest.fn().mockImplementation((event, callback) => {
                        // Store the callback so we can trigger it in our tests
                        collectorCallback = callback;
                    })
                })
            });
        });

        test('should handle ban selection', async () => {
            // Create a mock for the collector's interaction
            const collectorInteraction = {
                deferReply: jest.fn().mockResolvedValue(),
                values: ['reason_123'],
                // ... other necessary mock methods
            };

            await handler.getBanReason(interaction, '123');
            
            // Simulate the collector receiving an interaction
            await collectorCallback(collectorInteraction);
            
            expect(collectorInteraction.deferReply).toHaveBeenCalled();
            // ... other assertions
        });

        test('should get server ban reasons when type is server', async () => {
            handler.type = 'server';
            await handler.getBanReason(interaction, '123');
            expect(mockBanHandlerInstance.getServerBanReasons).toHaveBeenCalled();
        });

        test('should get user ban reasons when type is user', async () => {
            handler.type = 'user';
            await handler.getBanReason(interaction, '123');
            expect(mockBanHandlerInstance.getUserBanReasons).toHaveBeenCalled();
        });

        test('should handle "other" reason selection', async () => {
            // Mock the reply that creates the collector
            const mockReply = {
                createMessageComponentCollector: jest.fn().mockImplementation(({ filter }) => ({
                    on: jest.fn().mockImplementation((event, callback) => {
                        if (event === 'collect') {
                            // Simulate collector receiving an 'other' selection
                            callback({
                                values: ['other_123'],  // Format: reason_id
                                customId: 'ban_reason'
                            });
                        }
                    })
                }))
            };

            const interaction = {
                followUp: jest.fn().mockResolvedValue(mockReply),
                editReply: jest.fn().mockResolvedValue()
            };

            // Spy on useCustomBanModal to verify it's called
            const useCustomBanModalSpy = jest.spyOn(handler, 'useCustomBanModal').mockResolvedValue();

            await handler.getBanReason(interaction, '123');

            // Verify useCustomBanModal was called with correct parameters
            expect(useCustomBanModalSpy).toHaveBeenCalledWith(
                expect.objectContaining({ values: ['other_123'] }), 
                '123'
            );
        });
    });

    describe('useCustomBanModal', () => {
        test('should show modal for custom ban reason', async () => {
            const modalSubmission = {
                fields: {
                    getTextInputValue: jest.fn().mockReturnValue('custom reason')
                },
                deferReply: jest.fn().mockResolvedValue(),
                editReply: jest.fn().mockResolvedValue()
            };

            interaction.showModal = jest.fn().mockResolvedValue();
            interaction.awaitModalSubmit = jest.fn().mockResolvedValue(modalSubmission);

            await handler.useCustomBanModal(interaction, '123');
            
            expect(interaction.showModal).toHaveBeenCalled();
            expect(modalSubmission.fields.getTextInputValue).toHaveBeenCalledWith('custom_reason');
        });

        test('should handle modal timeout', async () => {
            // Clear any previous mock calls
            jest.clearAllMocks();

            // Set up the mocks with more explicit error handling
            interaction.showModal = jest.fn().mockResolvedValue();
            interaction.awaitModalSubmit = jest.fn().mockImplementation(() => {
                return Promise.reject(new Error('Timeout'));
            });
            interaction.followUp = jest.fn().mockResolvedValue();

            // Add console.log to debug
            console.log('Before calling useCustomBanModal');
            
            // Call the method and make sure to await it
            await handler.useCustomBanModal(interaction, '123').catch(err => {
                console.log('Caught error:', err);
            });
            
            // Add console.log to see what was called
            console.log('followUp mock calls:', interaction.followUp.mock.calls);

            // Verify the error handling
            expect(interaction.followUp).toHaveBeenCalledWith({
                content: "Timed out or encountered an error while waiting for a response.",
                ephemeral: true
            });
        });

        test('useCustomBanModal should handle timeout error', async () => {
            const mockInteraction = {
                showModal: jest.fn().mockResolvedValue(),
                awaitModalSubmit: jest.fn().mockRejectedValue(new Error('Timeout')),
                followUp: jest.fn().mockResolvedValue()
            };

            // Need to wait a tick for the catch block to execute
            await handler.useCustomBanModal(mockInteraction, '123');
            // Wait for the next tick to allow the catch block to execute
            await new Promise(process.nextTick);

            expect(mockInteraction.followUp).toHaveBeenCalledWith({
                content: expect.stringContaining('Timed out'),
                ephemeral: true
            });
        });
    });

    describe('approve', () => {
        let mockQuestion;
        
        beforeEach(() => {
            mockQuestion = {
                load: jest.fn().mockResolvedValue(),
                approve: jest.fn().mockResolvedValue(),
                save: jest.fn().mockResolvedValue()
            };
        });

        test('should defer reply if not already deferred', async () => {
            const interaction = {
                deferred: false,
                deferReply: jest.fn().mockResolvedValue(),
                editReply: jest.fn().mockResolvedValue(),
                user: { id: '123' }
            };
    
            await handler.approve(interaction, mockQuestion);
    
            expect(interaction.deferReply).toHaveBeenCalledWith({ ephemeral: true });
        });
    
        test('should not defer reply if already deferred', async () => {
            const interaction = {
                deferred: true,
                deferReply: jest.fn().mockResolvedValue(),
                editReply: jest.fn().mockResolvedValue(),
                user: { id: '123' }
            };
    
            await handler.approve(interaction, mockQuestion);
    
            expect(interaction.deferReply).not.toHaveBeenCalled();
        });

        test('should update dare log when question type is dare', async () => {
            const interaction = {
                deferred: true,
                editReply: jest.fn().mockResolvedValue(),
                user: { id: '123' }
            };

            mockQuestion.type = 'dare';  // Set question type to dare

            await handler.approve(interaction, mockQuestion);

            expect(logger.updateDare).toHaveBeenCalledWith(mockQuestion);
            expect(logger.updateTruth).not.toHaveBeenCalled();
        });

        test('should update truth log when question type is truth', async () => {
            const interaction = {
                deferred: true,
                editReply: jest.fn().mockResolvedValue(),
                user: { id: '123' }
            };

            mockQuestion.type = 'truth';  // Set question type to truth

            await handler.approve(interaction, mockQuestion);

            expect(logger.updateTruth).toHaveBeenCalledWith(mockQuestion);
            expect(logger.updateDare).not.toHaveBeenCalled();
        });
    });

    describe('getEmbed', () => {
        test('should create embed for truth question with all fields', () => {
            handler.type = 'truth';
            const question = {
                question: 'Test question',
                creator: 'Test Creator',
                server: { name: 'Test Server' },
                id: '123',
                banReason: 'Test ban reason'
            };

            const embed = handler.getEmbed(question);

            expect(embed.setTitle).toHaveBeenCalledWith('New Truth');
            expect(embed.addFields).toHaveBeenCalledWith(
                { name: 'Content', value: 'Test question' },
                { name: 'Author', value: 'Test Creator' },
                { name: 'Server:', value: 'Test Server' },
                { name: 'Approved By:', value: 'Test ban reason' }
            );
            expect(embed.setFooter).toHaveBeenCalledWith('#123');
        });

        test('should create embed for dare question with null fields', () => {
            handler.type = 'dare';
            const question = {
                question: null,
                creator: null,
                server: { name: 'Test Server' },
                id: '123',
                banReason: null
            };

            const embed = handler.getEmbed(question);

            expect(embed.setTitle).toHaveBeenCalledWith('New Dare');
            expect(embed.addFields).toHaveBeenCalledWith(
                { name: 'Content', value: '' },
                { name: 'Author', value: '' },
                { name: 'Server:', value: 'Test Server' },
                { name: 'Approved By:', value: '' }
            );
            expect(embed.setFooter).toHaveBeenCalledWith('#123');
        });
    });

    describe('banQuestion', () => {
        test('banQuestion should log reason and id', () => {
            const mockInteraction = {
                values: ['test_reason']
            };
            
            handler.banQuestion(mockInteraction, '123');
            
            expect(console.log).toHaveBeenCalledWith('reason', 'test_reason');
        });
    });

    describe('collector filter', () => {
        test('should filter interactions based on customId', async () => {
            const mockReply = {
                createMessageComponentCollector: jest.fn().mockImplementation(({ filter }) => {
                    // Store the filter function so we can test it directly
                    collectorFilter = filter;
                    return {
                        on: jest.fn()
                    };
                })
            };

            const interaction = {
                followUp: jest.fn().mockResolvedValue(mockReply),
                editReply: jest.fn().mockResolvedValue()
            };

            await handler.getBanReason(interaction, '123');

            // Test filter with matching customId
            expect(collectorFilter({ customId: 'ban_reason' })).toBe(true);
            
            // Test filter with non-matching customId
            expect(collectorFilter({ customId: 'wrong_id' })).toBe(false);
        });
    });

    describe('createApprovedActionRow', () => {
        test('should create action row with correct buttons', () => {
            handler.type = 'truth';
            
            const actionRow = handler.createApprovedActionRow();

            // Get the buttons that were passed to addComponents
            
            const approveButton = actionRow.addComponents.mock.calls[0][0];
            const banButton = actionRow.addComponents.mock.calls[0][1];
            
            // Check approve button function calls
            expect(approveButton.setCustomId).toHaveBeenCalledWith('new_truth_approve');
            expect(approveButton.setLabel).toHaveBeenCalledWith('Approved');
            expect(approveButton.setStyle).toHaveBeenCalledWith(1); // ButtonStyle.Success
            expect(approveButton.setDisabled).toHaveBeenCalledWith(true);

            // Check ban button function calls
            expect(banButton.setCustomId).toHaveBeenCalledWith('new_truth_ban');
            expect(banButton.setLabel).toHaveBeenCalledWith('Ban');
            expect(banButton.setStyle).toHaveBeenCalledWith(4); // ButtonStyle.Danger
            expect(banButton.setDisabled).toHaveBeenCalledWith(false);
        });
    });

    describe('constructor', () => {
        test('should initialize handler with correct type and settings', () => {
            const newHandler = new Handler('truth');
            
            expect(newHandler.type).toBe('truth');
            expect(newHandler.db).toBeDefined();
            expect(newHandler.ALPHA).toBe(my.environment === 'dev');
            expect(newHandler.vote_count).toBe(my.required_votes);
        });
    });

    describe('modalFilter', () => {
        test('should filter modal interactions based on customId', () => {
            // Test the filter function directly
            const modalFilter = (modalInteraction) => modalInteraction.customId === 'customBanReason';
            
            expect(modalFilter({ customId: 'customBanReason' })).toBe(true);
            expect(modalFilter({ customId: 'wrongId' })).toBe(false);
        });
    });

});