/**
 * Tab switching functionality for JSON/Markdown viewer
 * Injects tab UI after main.js has processed the JSON
 */
(function() {
    'use strict';

    // Create and inject the tab UI
    function createTabUI() {
        // Create tab navigation
        const tabNav = document.createElement('div');
        tabNav.className = 'tab-nav';
        tabNav.innerHTML = `
            <button class="tab-btn active" data-tab="json" aria-label="JSON Editor"></button>
            <button class="tab-btn" data-tab="markdown" aria-label="Markdown Editor"></button>
        `;

        // Create markdown tab content
        const markdownTab = document.createElement('div');
        markdownTab.id = 'markdown-tab';
        markdownTab.className = 'tab-content';
        markdownTab.innerHTML = `
            <div class="markdown-container">
                <div class="markdown-editor">
                    <div class="editor-header">
                        <span>Markdown Input</span>
                    </div>
                    <textarea id="markdown-input" placeholder="Paste or type your markdown here..."></textarea>
                </div>
                <div class="markdown-preview">
                    <div class="preview-header">Preview</div>
                    <div id="markdown-output" class="preview-content"></div>
                </div>
            </div>
        `;

        // Wrap existing JSON viewer content
        const body = document.body;
        const existingContent = Array.from(body.children).filter(el =>
            el.tagName !== 'SCRIPT' && !el.classList.contains('tab-nav')
        );

        // Create JSON tab wrapper
        const jsonTab = document.createElement('div');
        jsonTab.id = 'json-tab';
        jsonTab.className = 'tab-content active';

        // Move existing content into JSON tab
        existingContent.forEach(el => {
            if (el.tagName !== 'SCRIPT') {
                jsonTab.appendChild(el);
            }
        });

        // Insert tab nav at the beginning
        body.insertBefore(tabNav, body.firstChild);

        // Insert JSON tab after nav
        body.insertBefore(jsonTab, tabNav.nextSibling);

        // Insert markdown tab after JSON tab
        body.insertBefore(markdownTab, jsonTab.nextSibling);

        return { tabNav, jsonTab, markdownTab };
    }

    function switchTab(tabName) {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const jsonTab = document.getElementById('json-tab');
        const markdownTab = document.getElementById('markdown-tab');

        // Update button states
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update content visibility
        if (jsonTab) jsonTab.classList.toggle('active', tabName === 'json');
        if (markdownTab) markdownTab.classList.toggle('active', tabName === 'markdown');

        // Store last active tab
        try {
            localStorage.setItem('activeTab', tabName);
        } catch (e) {
            // localStorage may not be available
        }

        // Initialize markdown editor if switching to markdown tab
        if (tabName === 'markdown') {
            console.log('[Tabs] Switching to markdown tab, initMarkdownEditor available:', typeof window.initMarkdownEditor === 'function');
            if (typeof window.initMarkdownEditor === 'function') {
                window.initMarkdownEditor();
            }
        }
    }

    function init() {
        // Create the tab UI
        createTabUI();

        // Add click handlers to tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                switchTab(btn.dataset.tab);
            });
        });

        // Restore last active tab or default to JSON
        try {
            const savedTab = localStorage.getItem('activeTab');
            if (savedTab && (savedTab === 'json' || savedTab === 'markdown')) {
                switchTab(savedTab);
            }
        } catch (e) {
            // localStorage may not be available
        }
    }

    // Initialize after a short delay to ensure main.js has finished
    setTimeout(init, 100);
})();
