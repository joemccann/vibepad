/**
 * Tests for markdown cleanup functionality
 * Tests fallback cleanup when Prettier is not available
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load markdown.js and extract functions
const markdownJsPath = path.join(__dirname, '..', 'js', 'markdown.js');
const markdownJsContent = fs.readFileSync(markdownJsPath, 'utf8');

const context = {
    window: {},
    document: {
        readyState: 'complete',
        getElementById: () => null,
        addEventListener: () => {}
    },
    console,
    module: { exports: {} },
    // Prettier not available in test environment
    prettier: undefined,
    prettierPlugins: undefined
};
vm.createContext(context);
vm.runInContext(markdownJsContent, context);

const fallbackCleanup = context.window.fallbackCleanup;

describe('Markdown Fallback Cleanup', () => {

    describe('Basic functionality', () => {
        test('fallbackCleanup function should be defined', () => {
            expect(fallbackCleanup).toBeDefined();
            expect(typeof fallbackCleanup).toBe('function');
        });

        test('should return empty string for empty input', () => {
            expect(fallbackCleanup('')).toBe('');
            expect(fallbackCleanup(null)).toBe('');
            expect(fallbackCleanup(undefined)).toBe('');
        });
    });

    describe('Setext to ATX heading conversion', () => {
        test('should convert setext H1 (===) to ATX style (#)', () => {
            const input = `Main Title
===`;
            const result = fallbackCleanup(input);
            expect(result).toBe('# Main Title');
        });

        test('should convert setext H2 (---) to ATX style (##)', () => {
            const input = `Secondary Heading
---`;
            const result = fallbackCleanup(input);
            expect(result).toBe('## Secondary Heading');
        });

        test('should handle setext headings with leading whitespace', () => {
            const input = `  Main Title
  ===
  Secondary
  ---`;
            const result = fallbackCleanup(input);
            expect(result).toContain('# Main Title');
            expect(result).toContain('## Secondary');
        });
    });

    describe('Whitespace handling', () => {
        test('should remove trailing whitespace', () => {
            const input = `Line with trailing spaces
Another line`;
            const result = fallbackCleanup(input);
            const lines = result.split('\n');
            lines.forEach(line => {
                expect(line).toBe(line.trimEnd());
            });
        });

        test('should remove excessive leading whitespace from paragraphs', () => {
            const input = `  This has leading spaces
  Another indented line`;
            const result = fallbackCleanup(input);
            expect(result).toContain('This has leading spaces');
            expect(result).not.toMatch(/^\s+This/m);
        });

        test('should remove multiple consecutive blank lines', () => {
            const input = `First paragraph


Second paragraph`;
            const result = fallbackCleanup(input);
            expect(result).toBe('First paragraph\n\nSecond paragraph');
        });

        test('should remove leading and trailing blank lines', () => {
            const input = `

Content here

`;
            const result = fallbackCleanup(input);
            expect(result).toBe('Content here');
        });
    });

    describe('Complex input', () => {
        test('should handle mixed formatting', () => {
            const input = `Main Title
===
  This paragraph has extra whitespace.
Secondary Heading
---
  Another paragraph.`;

            const result = fallbackCleanup(input);

            expect(result).toContain('# Main Title');
            expect(result).toContain('## Secondary Heading');
            expect(result).toContain('This paragraph has extra whitespace.');
            expect(result).toContain('Another paragraph.');
        });
    });
});

describe('Extension file structure', () => {
    test('prettier-standalone.js should exist', () => {
        const filePath = path.join(__dirname, '..', 'js', 'prettier-standalone.js');
        expect(fs.existsSync(filePath)).toBe(true);
    });

    test('prettier-markdown.js should exist', () => {
        const filePath = path.join(__dirname, '..', 'js', 'prettier-markdown.js');
        expect(fs.existsSync(filePath)).toBe(true);
    });

    test('markdown.js should reference Prettier', () => {
        expect(markdownJsContent).toContain('prettier');
        expect(markdownJsContent).toContain('formatWithPrettier');
    });

    test('markdown.js should have fallback cleanup', () => {
        expect(markdownJsContent).toContain('fallbackCleanup');
    });
});
