const embedder = require('../embedder');
const { EmbedBuilder } = require('discord.js');

// Mock environment variables
process.env.DISCORD_INVITE_CODE = 'mock-invite';
process.env.BOT_INVITE_URL = 'mock-url';
global.my = {
    discord_invite_code: 'mock-invite',
    bot_invite_url: 'mock-url'
};

describe('Embedder', () => {
    describe('help()', () => {
        test('should create help embed with setup=true', () => {
            const embed = embedder.help(true);
            
            expect(embed).toBeInstanceOf(EmbedBuilder);
            // Should have the setup-specific fields
            expect(embed.data.fields).toContainEqual(
                expect.objectContaining({
                    name: 'Creating Truths or Dares'
                })
            );
            // Should NOT have the getting started fields
            expect(embed.data.fields).not.toContainEqual(
                expect.objectContaining({
                    name: 'Getting Started'
                })
            );
        });

        test('should create help embed with setup=false', () => {
            const embed = embedder.help(false);
            
            expect(embed).toBeInstanceOf(EmbedBuilder);
            // Should have the getting started fields
            expect(embed.data.fields).toContainEqual(
                expect.objectContaining({
                    name: 'Getting Started'
                })
            );
            // Should NOT have the setup-specific fields
            expect(embed.data.fields).not.toContainEqual(
                expect.objectContaining({
                    name: 'Creating Truths or Dares'
                })
            );
        });

        test('should create help embed with default setup value', () => {
            const embed = embedder.help(); // No parameter passed
            
            expect(embed).toBeInstanceOf(EmbedBuilder);
            // Should behave like setup=true
            expect(embed.data.fields).toContainEqual(
                expect.objectContaining({
                    name: 'Creating Truths or Dares'
                })
            );
        });
    });

    describe('terms()', () => {
        test('should create terms embed', () => {
            const embed = embedder.terms();
            
            expect(embed).toBeInstanceOf(EmbedBuilder);
            expect(embed.data.title).toBe('Accept these Terms and Conditions to proceed');
            // Verify all terms sections are present
            expect(embed.data.fields).toContainEqual(
                expect.objectContaining({
                    name: '1. Acknowledgment'
                })
            );
        });
    });

    describe('rules()', () => {
        test('should create rules embed', () => {
            const embed = embedder.rules();
            
            expect(embed).toBeInstanceOf(EmbedBuilder);
            expect(embed.data.title).toBe('Avoiding Bans');
            // Verify all rule sections are present
            expect(embed.data.fields).toContainEqual(
                expect.objectContaining({
                    name: 'No Dangerous Or Illegal Content',
                    value: '- Keep it safe and legal'
                })
            );
        });
    });

    describe('accepted()', () => {
        test('should create accepted embed', () => {
            const embed = embedder.accepted();
            
            expect(embed).toBeInstanceOf(EmbedBuilder);
            expect(embed.data.title).toBe('Terms Accepted');
            expect(embed.data.description).toContain('We hope you enjoy');
        });
    });

    describe('vote()', () => {
        test('should create vote embed', () => {
            const embed = embedder.vote();
            
            expect(embed).toBeInstanceOf(EmbedBuilder);
            expect(embed.data.title).toBe('Upvote the bot for special privileges');
            // Verify vote benefits are listed
            expect(embed.data.fields).toContainEqual(
                expect.objectContaining({
                    name: 'Earn Skips for every vote!'
                })
            );
            // Verify footer
            expect(embed.data.footer.text).toBe('Thank you for voting :)');
        });
    });

    // Test link fields in various embeds
    describe('embed links', () => {
        test('should include correct links in help embed', () => {
            const embed = embedder.help(true);
            
            const linkFields = embed.data.fields.filter(field => 
                field.name === 'For news, updates and help' || 
                field.name === 'Got your own community?'
            );
            
            expect(linkFields).toHaveLength(2);
            expect(linkFields[0].value).toContain('mock-invite');
            expect(linkFields[1].value).toContain('mock-url');
        });

        test('should include correct links in terms embed', () => {
            const embed = embedder.terms();
            
            const linkFields = embed.data.fields.filter(field => 
                field.name === 'For updates and help' || 
                field.name === 'Got your own community?'
            );
            
            expect(linkFields).toHaveLength(2);
            expect(linkFields[0].value).toContain('mock-invite');
            expect(linkFields[1].value).toContain('mock-url');
        });
    });
});
