/**
 * New Tab JSON & Markdown Editor
 * A simple editor that works within MV3 CSP restrictions
 */
(function() {
    'use strict';

    // ==================== Tab Switching ====================

    function initTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;

                // Update buttons
                tabButtons.forEach(b => b.classList.toggle('active', b === btn));

                // Update content
                tabContents.forEach(content => {
                    content.classList.toggle('active', content.id === tabName + '-tab');
                });

                // Save preference
                try {
                    localStorage.setItem('activeTab', tabName);
                } catch (e) {}
            });
        });

        // Restore last tab
        try {
            const savedTab = localStorage.getItem('activeTab');
            if (savedTab) {
                const btn = document.querySelector(`.tab-btn[data-tab="${savedTab}"]`);
                if (btn) btn.click();
            }
        } catch (e) {}
    }

    // ==================== JSON Editor ====================

    function initJsonEditor() {
        const input = document.getElementById('json-input');
        const treeView = document.getElementById('json-tree');
        const errorEl = document.getElementById('json-error');
        const formatBtn = document.getElementById('format-json');
        const minifyBtn = document.getElementById('minify-json');
        const clearBtn = document.getElementById('clear-json');

        let debounceTimer = null;

        function parseAndRender() {
            const value = input.value.trim();

            if (!value) {
                treeView.innerHTML = '<div class="empty">Paste JSON to see tree view</div>';
                errorEl.classList.remove('visible');
                return;
            }

            try {
                const data = JSON.parse(value);
                treeView.innerHTML = '';
                treeView.appendChild(renderTree(data));
                errorEl.classList.remove('visible');
            } catch (e) {
                errorEl.textContent = 'Parse Error: ' + e.message;
                errorEl.classList.add('visible');
            }
        }

        function renderTree(data, key = null) {
            const container = document.createElement('div');
            container.className = 'tree-node';

            if (data === null) {
                container.innerHTML = formatKeyValue(key, '<span class="tree-null">null</span>');
            } else if (typeof data === 'boolean') {
                container.innerHTML = formatKeyValue(key, `<span class="tree-boolean">${data}</span>`);
            } else if (typeof data === 'number') {
                container.innerHTML = formatKeyValue(key, `<span class="tree-number">${data}</span>`);
            } else if (typeof data === 'string') {
                const escaped = escapeHtml(data);
                container.innerHTML = formatKeyValue(key, `<span class="tree-string">"${escaped}"</span>`);
            } else if (Array.isArray(data)) {
                container.innerHTML = formatKeyValue(key, '<span class="tree-bracket">[</span>');
                container.classList.add('tree-expanded');

                if (data.length > 0) {
                    const toggle = document.createElement('span');
                    toggle.className = 'tree-toggle';
                    toggle.addEventListener('click', () => {
                        container.classList.toggle('tree-expanded');
                        container.classList.toggle('tree-collapsed');
                    });
                    container.insertBefore(toggle, container.firstChild);

                    const children = document.createElement('div');
                    children.className = 'tree-children tree-item';
                    data.forEach((item, i) => {
                        children.appendChild(renderTree(item, i));
                    });
                    container.appendChild(children);
                }

                const closeBracket = document.createElement('span');
                closeBracket.className = 'tree-bracket';
                closeBracket.textContent = ']';
                container.appendChild(closeBracket);
            } else if (typeof data === 'object') {
                container.innerHTML = formatKeyValue(key, '<span class="tree-bracket">{</span>');
                container.classList.add('tree-expanded');

                const keys = Object.keys(data);
                if (keys.length > 0) {
                    const toggle = document.createElement('span');
                    toggle.className = 'tree-toggle';
                    toggle.addEventListener('click', () => {
                        container.classList.toggle('tree-expanded');
                        container.classList.toggle('tree-collapsed');
                    });
                    container.insertBefore(toggle, container.firstChild);

                    const children = document.createElement('div');
                    children.className = 'tree-children tree-item';
                    keys.forEach(k => {
                        children.appendChild(renderTree(data[k], k));
                    });
                    container.appendChild(children);
                }

                const closeBracket = document.createElement('span');
                closeBracket.className = 'tree-bracket';
                closeBracket.textContent = '}';
                container.appendChild(closeBracket);
            }

            return container;
        }

        function formatKeyValue(key, valueHtml) {
            if (key !== null) {
                const keyStr = typeof key === 'number' ? key : `"${escapeHtml(key)}"`;
                return `<span class="tree-key">${keyStr}</span>: ${valueHtml}`;
            }
            return valueHtml;
        }

        function escapeHtml(str) {
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(parseAndRender, 150);
        });

        formatBtn.addEventListener('click', () => {
            try {
                const data = JSON.parse(input.value);
                input.value = JSON.stringify(data, null, 2);
                parseAndRender();
            } catch (e) {
                errorEl.textContent = 'Cannot format: ' + e.message;
                errorEl.classList.add('visible');
            }
        });

        minifyBtn.addEventListener('click', () => {
            try {
                const data = JSON.parse(input.value);
                input.value = JSON.stringify(data);
                parseAndRender();
            } catch (e) {
                errorEl.textContent = 'Cannot minify: ' + e.message;
                errorEl.classList.add('visible');
            }
        });

        clearBtn.addEventListener('click', () => {
            input.value = '';
            parseAndRender();
            input.focus();
        });

        // Load saved JSON
        try {
            const saved = localStorage.getItem('jsonEditorContent');
            if (saved) {
                input.value = saved;
                parseAndRender();
            }
        } catch (e) {}

        // Save on change
        input.addEventListener('input', () => {
            try {
                localStorage.setItem('jsonEditorContent', input.value);
            } catch (e) {}
        });

        // Initial render
        parseAndRender();

        // Focus input
        input.focus();
    }

    // ==================== Markdown Editor ====================

    function initMarkdownEditor() {
        const input = document.getElementById('markdown-input');
        const output = document.getElementById('markdown-output');
        const formatBtn = document.getElementById('format-md');
        const clearBtn = document.getElementById('clear-md');

        let debounceTimer = null;

        function renderMarkdown() {
            const value = input.value;
            if (!value.trim()) {
                output.innerHTML = '<div class="empty" style="color: #808080; font-style: italic;">Paste markdown to see preview</div>';
                return;
            }

            if (typeof marked !== 'undefined') {
                output.innerHTML = marked.parse(value);
            } else {
                output.textContent = value;
            }
        }

        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(renderMarkdown, 150);
        });

        formatBtn.addEventListener('click', async () => {
            if (typeof prettier !== 'undefined' && typeof prettierPlugins !== 'undefined') {
                try {
                    const formatted = await prettier.format(input.value, {
                        parser: 'markdown',
                        plugins: prettierPlugins,
                        proseWrap: 'preserve'
                    });
                    input.value = formatted;
                    renderMarkdown();
                } catch (e) {
                    console.error('Prettier error:', e);
                }
            }
        });

        clearBtn.addEventListener('click', () => {
            input.value = '';
            renderMarkdown();
            input.focus();
        });

        // Load saved markdown
        try {
            const saved = localStorage.getItem('markdownEditorContent');
            if (saved) {
                input.value = saved;
                renderMarkdown();
            }
        } catch (e) {}

        // Save on change
        input.addEventListener('input', () => {
            try {
                localStorage.setItem('markdownEditorContent', input.value);
            } catch (e) {}
        });

        // Initial render
        renderMarkdown();
    }

    // ==================== Initialize ====================

    document.addEventListener('DOMContentLoaded', () => {
        initTabs();
        initJsonEditor();
        initMarkdownEditor();
    });
})();
