/**
 * Markdown Editor with live preview and Prettier formatting
 * Uses Prettier (https://prettier.io/) for professional markdown formatting
 */
(function() {
    'use strict';

    /**
     * Format markdown using Prettier
     * @param {string} markdown - Raw markdown text
     * @returns {Promise<string>} - Formatted markdown
     */
    async function formatWithPrettier(markdown) {
        if (!markdown || !markdown.trim()) return '';

        // Check if Prettier is loaded
        if (typeof prettier === 'undefined' || typeof prettierPlugins === 'undefined') {
            console.warn('[Markdown] Prettier not loaded, using fallback');
            return fallbackCleanup(markdown);
        }

        try {
            const formatted = await prettier.format(markdown, {
                parser: 'markdown',
                plugins: prettierPlugins,
                // Prettier markdown options
                proseWrap: 'always',      // Wrap prose to printWidth
                printWidth: 80,           // Line width
                tabWidth: 2,              // Tab width for lists
                useTabs: false,           // Use spaces
                singleQuote: true,        // For embedded code
            });
            return formatted.trim();
        } catch (e) {
            console.error('[Markdown] Prettier error:', e);
            return fallbackCleanup(markdown);
        }
    }

    /**
     * Synchronous cleanup for paste events (Prettier is async)
     * Basic cleanup that runs before Prettier can process
     * @param {string} markdown - Raw markdown text
     * @returns {string} - Cleaned markdown
     */
    function fallbackCleanup(markdown) {
        if (!markdown) return '';

        let lines = markdown.split('\n');
        let result = [];
        let i = 0;

        while (i < lines.length) {
            let line = lines[i];
            let nextLine = lines[i + 1] || '';

            // Trim trailing whitespace
            line = line.trimEnd();

            // Convert setext headings to ATX
            if (nextLine.match(/^\s*=+\s*$/) && line.trim()) {
                result.push('# ' + line.trim());
                i += 2;
                continue;
            }
            if (nextLine.match(/^\s*-{2,}\s*$/) && line.trim() && !line.match(/^\s*[-*+]\s/)) {
                result.push('## ' + line.trim());
                i += 2;
                continue;
            }

            // Remove excessive leading whitespace from paragraphs
            if (line.match(/^\s{1,3}\S/) && !line.match(/^\s*[-*+\d>]/)) {
                line = line.trimStart();
            }

            result.push(line);
            i++;
        }

        // Remove multiple consecutive blank lines
        let cleaned = [];
        let lastWasBlank = false;
        for (const line of result) {
            const isBlank = line.trim() === '';
            if (isBlank && lastWasBlank) continue;
            cleaned.push(line);
            lastWasBlank = isBlank;
        }

        // Trim leading/trailing blank lines
        while (cleaned.length > 0 && cleaned[0].trim() === '') cleaned.shift();
        while (cleaned.length > 0 && cleaned[cleaned.length - 1].trim() === '') cleaned.pop();

        return cleaned.join('\n');
    }

    /**
     * Render markdown to HTML
     * @param {string} markdown - Markdown text
     * @returns {string} - HTML string
     */
    function renderMarkdown(markdown) {
        if (typeof marked === 'undefined') {
            console.warn('marked.js not loaded');
            return '<p>Markdown renderer not available</p>';
        }

        try {
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: true,
                mangle: false
            });
            return marked.parse(markdown);
        } catch (e) {
            console.error('Markdown parsing error:', e);
            return '<p class="error">Error parsing markdown</p>';
        }
    }

    /**
     * Initialize markdown editor
     */
    let initialized = false;

    function initMarkdownEditor() {
        const input = document.getElementById('markdown-input');
        const output = document.getElementById('markdown-output');

        console.log('[Markdown] Init called. Elements:', {
            input: !!input,
            output: !!output,
            prettier: typeof prettier !== 'undefined',
            prettierPlugins: typeof prettierPlugins !== 'undefined'
        });

        if (!input || !output) {
            console.warn('[Markdown] Elements not found, retrying...');
            setTimeout(initMarkdownEditor, 100);
            return;
        }

        if (initialized) {
            console.log('[Markdown] Already initialized');
            return;
        }

        initialized = true;

        // Live preview on input
        input.addEventListener('input', function() {
            output.innerHTML = renderMarkdown(input.value);
        });

        // Cleanup on paste - use fallback for immediate feedback, then Prettier
        input.addEventListener('paste', async function(e) {
            console.log('[Markdown] Paste event');
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');

            // Quick fallback cleanup first
            let cleanedText = fallbackCleanup(pastedText);

            const start = input.selectionStart;
            const end = input.selectionEnd;
            const before = input.value.substring(0, start);
            const after = input.value.substring(end);

            input.value = before + cleanedText + after;
            const newPos = start + cleanedText.length;
            input.setSelectionRange(newPos, newPos);
            output.innerHTML = renderMarkdown(input.value);

            // Then apply Prettier formatting async
            try {
                const prettierFormatted = await formatWithPrettier(input.value);
                if (prettierFormatted && prettierFormatted !== input.value) {
                    input.value = prettierFormatted;
                    output.innerHTML = renderMarkdown(prettierFormatted);
                    console.log('[Markdown] Prettier formatting applied');
                }
            } catch (e) {
                console.warn('[Markdown] Prettier post-paste formatting failed:', e);
            }
        });

        // Keyboard shortcut: Ctrl/Cmd + Shift + F to manually format
        input.addEventListener('keydown', async function(e) {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
                e.preventDefault();
                try {
                    const formatted = await formatWithPrettier(input.value);
                    input.value = formatted;
                    output.innerHTML = renderMarkdown(formatted);
                } catch (e) {
                    console.error('[Markdown] Keyboard shortcut format error:', e);
                }
            }
        });

        console.log('[Markdown] Initialization complete');
    }

    // Export for testing
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { fallbackCleanup, renderMarkdown };
    }

    // Make functions available globally
    window.formatWithPrettier = formatWithPrettier;
    window.fallbackCleanup = fallbackCleanup;
    window.initMarkdownEditor = initMarkdownEditor;
})();
