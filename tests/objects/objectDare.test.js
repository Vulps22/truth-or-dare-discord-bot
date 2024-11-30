const Dare = require('objects/dare.js');

describe('Dare', () => {
    test('creates a dare instance', () => {
        const dare = new Dare();
        expect(dare).toBeInstanceOf(Dare);
    });

    test('has correct type', () => {
        const dare = new Dare();
        expect(dare.type).toBe('dare');
    });

    // If there's a constructor parameter or condition in the class,
    // we should test both branches
    test('handles constructor parameters', () => {
        const dare1 = new Dare(123);
        const dare2 = new Dare();
        
        // Test whatever the parameter does
        // For example, if it sets an ID:
        expect(dare1.id).toBe(123);
        expect(dare2.id).toBeUndefined();
    });
});
