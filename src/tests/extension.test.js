const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..');

describe('Chrome Extension Structure', () => {
    let manifest;

    beforeAll(() => {
        const manifestPath = path.join(SRC_DIR, 'manifest.json');
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        manifest = JSON.parse(manifestContent);
    });

    describe('manifest.json', () => {
        test('should be valid JSON', () => {
            expect(manifest).toBeDefined();
            expect(typeof manifest).toBe('object');
        });

        test('should use manifest version 3', () => {
            expect(manifest.manifest_version).toBe(3);
        });

        test('should have chrome_url_overrides for newtab', () => {
            expect(manifest.chrome_url_overrides).toBeDefined();
            expect(manifest.chrome_url_overrides.newtab).toBe('index.html');
        });

        test('should NOT have action (toolbar icon)', () => {
            expect(manifest.action).toBeUndefined();
        });

        test('should have required permissions', () => {
            expect(manifest.permissions).toContain('contextMenus');
            expect(manifest.permissions).toContain('storage');
        });

        test('should have background service worker', () => {
            expect(manifest.background).toBeDefined();
            expect(manifest.background.service_worker).toBe('/js/background.js');
        });

        test('should have content scripts configured', () => {
            expect(manifest.content_scripts).toBeDefined();
            expect(manifest.content_scripts.length).toBeGreaterThan(0);
            expect(manifest.content_scripts[0].js).toContain('/js/contentScript.js');
        });

        test('should have options page', () => {
            expect(manifest.options_page).toBe('options.html');
        });

        test('should have icons defined', () => {
            expect(manifest.icons).toBeDefined();
            expect(manifest.icons['16']).toBeDefined();
            expect(manifest.icons['32']).toBeDefined();
            expect(manifest.icons['128']).toBeDefined();
        });
    });

    describe('Required files exist', () => {
        test('index.html (new tab page) should exist', () => {
            const filePath = path.join(SRC_DIR, 'index.html');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('options.html should exist', () => {
            const filePath = path.join(SRC_DIR, 'options.html');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('background.js should exist', () => {
            const filePath = path.join(SRC_DIR, 'js', 'background.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('main.js should exist', () => {
            const filePath = path.join(SRC_DIR, 'js', 'main.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('contentScript.js should exist', () => {
            const filePath = path.join(SRC_DIR, 'js', 'contentScript.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('options.js should exist', () => {
            const filePath = path.join(SRC_DIR, 'js', 'options.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('style.css should exist', () => {
            const filePath = path.join(SRC_DIR, 'css', 'style.css');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('dark theme CSS should exist', () => {
            const filePath = path.join(SRC_DIR, 'css', 'color-themes', 'dark-pro.css');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('light theme CSS should exist', () => {
            const filePath = path.join(SRC_DIR, 'css', 'color-themes', 'mdn-light.css');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('tabs.js should exist', () => {
            const filePath = path.join(SRC_DIR, 'js', 'tabs.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('markdown.js should exist', () => {
            const filePath = path.join(SRC_DIR, 'js', 'markdown.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('marked.min.js should exist', () => {
            const filePath = path.join(SRC_DIR, 'js', 'marked.min.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('prettier-standalone.js should exist', () => {
            const filePath = path.join(SRC_DIR, 'js', 'prettier-standalone.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('prettier-markdown.js should exist', () => {
            const filePath = path.join(SRC_DIR, 'js', 'prettier-markdown.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('tabs.css should exist', () => {
            const filePath = path.join(SRC_DIR, 'css', 'tabs.css');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('markdown.css should exist', () => {
            const filePath = path.join(SRC_DIR, 'css', 'markdown.css');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('icon files should exist', () => {
            expect(fs.existsSync(path.join(SRC_DIR, 'images', 'icons', 'icon-16.png'))).toBe(true);
            expect(fs.existsSync(path.join(SRC_DIR, 'images', 'icons', 'icon-32.png'))).toBe(true);
            expect(fs.existsSync(path.join(SRC_DIR, 'images', 'icons', 'icon-128.png'))).toBe(true);
        });
    });

    describe('markdown.js content', () => {
        let markdownContent;

        beforeAll(() => {
            const filePath = path.join(SRC_DIR, 'js', 'markdown.js');
            markdownContent = fs.readFileSync(filePath, 'utf8');
        });

        test('should have formatWithPrettier function', () => {
            expect(markdownContent).toContain('formatWithPrettier');
        });

        test('should have fallbackCleanup function', () => {
            expect(markdownContent).toContain('fallbackCleanup');
        });

        test('should have renderMarkdown function', () => {
            expect(markdownContent).toContain('function renderMarkdown');
        });

        test('should reference Prettier', () => {
            expect(markdownContent).toContain('prettier');
        });

        test('should have paste event handler', () => {
            expect(markdownContent).toContain('paste');
        });
    });

    describe('tabs.js content', () => {
        let tabsContent;

        beforeAll(() => {
            const filePath = path.join(SRC_DIR, 'js', 'tabs.js');
            tabsContent = fs.readFileSync(filePath, 'utf8');
        });

        test('should have tab switching functionality', () => {
            expect(tabsContent).toContain('switchTab');
        });

        test('should handle localStorage for tab persistence', () => {
            expect(tabsContent).toContain('localStorage');
        });
    });

    describe('background.js content', () => {
        let backgroundContent;

        beforeAll(() => {
            const filePath = path.join(SRC_DIR, 'js', 'background.js');
            backgroundContent = fs.readFileSync(filePath, 'utf8');
        });

        test('should NOT have action.onClicked listener', () => {
            expect(backgroundContent).not.toContain('chrome.action.onClicked');
        });

        test('should have context menu creation', () => {
            expect(backgroundContent).toContain('chrome.contextMenus.create');
        });

        test('should have options storage handling', () => {
            expect(backgroundContent).toContain('chrome.storage.local');
        });

        test('should have message listener for options', () => {
            expect(backgroundContent).toContain('chrome.runtime.onMessage');
            expect(backgroundContent).toContain('give_me_options');
        });
    });
});
