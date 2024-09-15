const Database = require('objects/database');
const Server = require('objects/server');
const User = require('objects/user');
const Question = require('objects/question');
const Dare = require('objects/dare');
const Truth = require('objects/truth');

jest.mock('objects/database', () => {
    return jest.fn().mockImplementation(() => {
        return {
            get: jest.fn(),
            set: jest.fn(),
            query: jest.fn()
        };
    });
});

jest.mock('objects/server', () => {
    return jest.fn().mockImplementation((id) => {
        return {
            id: id,
            load: jest.fn().mockResolvedValue({
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
            })
        };
    });
});

jest.mock('objects/user', () => {
    return jest.fn().mockImplementation((id) => {
        return {
            id: id,
            get: jest.fn(),
            username: 'testuser'
        };
    });
});


describe('Question', () => {
    let dbMock;
    let serverMock;
    let question;

    beforeEach(() => {
        dbMock = new Database();
        serverMock = new Server();
        question = new Question(1, 'truth');
        question.db = dbMock; // Inject mock database instance
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should load question data correctly', async () => {
        const questionData = {
            id: 1,
            question: 'Sample Question',
            creator: 'CreatorID',
            isApproved: 1,
            isBanned: 0,
            banReason: '',
            messageId: 'MessageID',
            serverId: 1
        };

        dbMock.get.mockResolvedValue(questionData);
        serverMock.load.mockResolvedValue();

        await question.load();

        expect(question.question).toBe(questionData.question);
        expect(question.creator).toBe(questionData.creator);
        expect(question.isApproved).toBe(questionData.isApproved);
        expect(question.server.id).toBe(1);
        expect(question.exists).toBe(true);
    });

    test('should create a new question correctly', async () => {
        dbMock.set.mockResolvedValue(2);
        serverMock.load.mockResolvedValue();

        await question.create('New Question', 'CreatorID', 1);

        expect(question.question).toBe('New Question');
        expect(question.creator).toBe('CreatorID');
        expect(question.server.id).toBe(1);
        expect(question.id).toBe(2);
        expect(question.exists).toBe(true);
    });

    test('should throw an error if question, creator, or serverId is missing in create method', async () => {
        await expect(question.create(null, 'CreatorID', 1)).rejects.toThrow("Question, creator or serverId is not defined in new Question");
        await expect(question.create('New Question', null, 1)).rejects.toThrow("Question, creator or serverId is not defined in new Question");
        await expect(question.create('New Question', 'CreatorID', null)).rejects.toThrow("Question, creator or serverId is not defined in new Question");
    });
    

    test('should save question data correctly', async () => {
        // Mock server load
        serverMock.load.mockResolvedValue();
        
        // Mock database get to load the question
        dbMock.get.mockResolvedValue({
            id: 1,
            question: 'Sample Question',
            creator: 'CreatorID',
            isApproved: 0,
            isBanned: 0,
            banReason: '',
            messageId: 'MessageID',
            serverId: 1
        });
    
        // Load the question to initialize its properties
        await question.load();
    
        // Change the messageId to trigger a save
        question.messageId = 'MessageID';
        await question.save();
    
        const expectedData = {
            id: 1,
            question: 'Sample Question',
            creator: 'CreatorID',
            isApproved: 0,
            isBanned: 0,
            banReason: '',
            serverId: 1,
            messageId: 'MessageID',
        };
    
        expect(dbMock.set).toHaveBeenCalledWith('questions', expectedData);
    });
    

    test('should ban a question correctly', async () => {

        // Mock server load
        serverMock.load.mockResolvedValue();
        
        // Mock database get to load the question
        dbMock.get.mockResolvedValue({
            id: 1,
            question: 'Sample Question',
            creator: 'CreatorID',
            isApproved: 0,
            isBanned: 0,
            banReason: '',
            messageId: 'MessageID',
            serverId: 1
        });
    
        // Load the question to initialize its properties
        await question.load();

        question.messageId = 'MessageID';
        await question.ban('Inappropriate content');

        expect(question.isBanned).toBe(1);
        expect(question.banReason).toBe('Inappropriate content');
        expect(dbMock.set).toHaveBeenCalled();
    });

    test('should approve a question correctly', async () => {
        // Mock server load
        serverMock.load.mockResolvedValue();
        
        // Mock database get to load the question
        dbMock.get.mockResolvedValue({
            id: 1,
            question: 'Sample Question',
            creator: 'CreatorID',
            isApproved: 0,
            isBanned: 0,
            banReason: '',
            messageId: 'MessageID',
            serverId: 1
        });
    
        // Load the question to initialize its properties
        await question.load();

        question.messageId = 'MessageID';
        await question.approve();

        expect(question.isApproved).toBe(1);
        expect(dbMock.set).toHaveBeenCalled();
    });

    test('should find question by message ID', async () => {
        dbMock.query.mockResolvedValue([{ id: 1 }]);
        dbMock.get.mockResolvedValue({
            id: 1,
            question: 'Sample Question',
            creator: 'CreatorID',
            isApproved: 1,
            isBanned: 0,
            banReason: '',
            messageId: 'MessageID',
            serverId: 1
        });
        serverMock.load.mockResolvedValue();

        await question.find('MessageID');

        expect(question.id).toBe(1);
        expect(question.exists).toBe(true);
    });

    test('should get creator username correctly', async () => {
        const userMock = new User();
        userMock.get.mockResolvedValue();
        question.creator = 'CreatorID';

        const username = await question.getCreatorUsername();

        expect(username).toBe('testuser');
    });
});

describe('Dare', () => {
    let dare;

    beforeEach(() => {
        dare = new Dare(1);
    });

    test('should have type dare', () => {
        expect(dare.type).toBe('dare');
    });

    // You can add more tests specific to Dare here if needed
});

describe('Truth', () => {
    let truth;

    beforeEach(() => {
        truth = new Truth(1);
    });

    test('should have type truth', () => {
        expect(truth.type).toBe('truth');
    });

    // You can add more tests specific to Truth here if needed
});
