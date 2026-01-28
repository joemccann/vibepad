/**
 * VibePad - New Tab JSON & Markdown Editor
 * A modern editor with keyboard shortcuts, resizable panels, and loading states
 */
(function() {
    'use strict';

    // ==================== Utilities ====================

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? '⌘' : 'Ctrl';

    function showToast(message, type = 'success') {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.className = `toast ${type}`;

        // Trigger reflow for animation
        toast.offsetHeight;
        toast.classList.add('visible');

        setTimeout(() => {
            toast.classList.remove('visible');
        }, 2500);
    }

    function setLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

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

                // Focus the appropriate input
                const input = document.getElementById(tabName === 'json' ? 'json-input' : 'markdown-input');
                if (input) input.focus();

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

        // Tab keyboard shortcuts (Ctrl/Cmd + 1, 2)
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
                if (e.key === '1') {
                    e.preventDefault();
                    document.querySelector('.tab-btn[data-tab="json"]')?.click();
                } else if (e.key === '2') {
                    e.preventDefault();
                    document.querySelector('.tab-btn[data-tab="markdown"]')?.click();
                }
            }
        });
    }

    // ==================== Resizable Panels ====================

    function initResizablePanels() {
        document.querySelectorAll('.editor-container').forEach(container => {
            const editorPanel = container.querySelector('.editor-panel');
            if (!editorPanel) return;

            // Create resize handle
            const handle = document.createElement('div');
            handle.className = 'resize-handle';
            editorPanel.appendChild(handle);

            let isResizing = false;
            let startX = 0;
            let startWidth = 0;

            handle.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.clientX;
                startWidth = editorPanel.offsetWidth;
                handle.classList.add('active');
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;

                const containerWidth = container.offsetWidth;
                const newWidth = startWidth + (e.clientX - startX);
                const minWidth = 200;
                const maxWidth = containerWidth - 200;

                const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
                const percentage = (clampedWidth / containerWidth) * 100;

                editorPanel.style.flex = 'none';
                editorPanel.style.width = `${percentage}%`;
            });

            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    handle.classList.remove('active');
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';

                    // Save panel width
                    try {
                        const tabId = container.closest('.tab-content')?.id;
                        if (tabId) {
                            localStorage.setItem(`panelWidth_${tabId}`, editorPanel.style.width);
                        }
                    } catch (e) {}
                }
            });

            // Restore saved width
            try {
                const tabId = container.closest('.tab-content')?.id;
                const savedWidth = localStorage.getItem(`panelWidth_${tabId}`);
                if (savedWidth) {
                    editorPanel.style.flex = 'none';
                    editorPanel.style.width = savedWidth;
                }
            } catch (e) {}
        });
    }

    // ==================== JSON Editor ====================

    function initJsonEditor() {
        const input = document.getElementById('json-input');
        const treeView = document.getElementById('json-tree');
        const errorEl = document.getElementById('json-error');
        const formatBtn = document.getElementById('format-json');
        const minifyBtn = document.getElementById('minify-json');
        const clearBtn = document.getElementById('clear-json');
        const importBtn = document.getElementById('import-json');
        const fileInput = document.getElementById('json-file-input');

        let debounceTimer = null;

        // Add keyboard shortcut hints
        formatBtn.innerHTML = `Format <span class="shortcut">${modKey}+⇧+F</span>`;
        minifyBtn.innerHTML = `Minify <span class="shortcut">${modKey}+⇧+M</span>`;
        clearBtn.innerHTML = `Clear <span class="shortcut">${modKey}+K</span>`;

        function parseAndRender() {
            const value = input.value.trim();

            if (!value) {
                treeView.innerHTML = `
                    <div class="empty-state" style="opacity: 1; position: relative; transform: none;">
                        <div class="empty-state-icon">{ }</div>
                        <div class="empty-state-title">No JSON to display</div>
                        <div class="empty-state-hint">
                            Paste JSON or drag & drop a <kbd>.json</kbd> file<br>
                            <kbd>${modKey}</kbd> + <kbd>V</kbd> to paste
                        </div>
                    </div>
                `;
                errorEl.classList.remove('visible');
                return;
            }

            try {
                const data = JSON.parse(value);
                treeView.innerHTML = '';
                treeView.appendChild(renderTree(data));
                errorEl.classList.remove('visible');
            } catch (e) {
                errorEl.textContent = e.message;
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
                container.innerHTML = formatKeyValue(key, `<span class="tree-bracket">[</span><span class="tree-count" style="color: var(--text-muted); font-size: 11px; margin-left: 4px;">${data.length} items</span>`);
                container.classList.add('tree-expanded');

                if (data.length > 0) {
                    const toggle = document.createElement('span');
                    toggle.className = 'tree-toggle';
                    toggle.tabIndex = 0;
                    toggle.setAttribute('role', 'button');
                    toggle.setAttribute('aria-expanded', 'true');
                    toggle.addEventListener('click', () => toggleNode(container, toggle));
                    toggle.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleNode(container, toggle);
                        }
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
                const keys = Object.keys(data);
                container.innerHTML = formatKeyValue(key, `<span class="tree-bracket">{</span><span class="tree-count" style="color: var(--text-muted); font-size: 11px; margin-left: 4px;">${keys.length} keys</span>`);
                container.classList.add('tree-expanded');

                if (keys.length > 0) {
                    const toggle = document.createElement('span');
                    toggle.className = 'tree-toggle';
                    toggle.tabIndex = 0;
                    toggle.setAttribute('role', 'button');
                    toggle.setAttribute('aria-expanded', 'true');
                    toggle.addEventListener('click', () => toggleNode(container, toggle));
                    toggle.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleNode(container, toggle);
                        }
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

        function toggleNode(container, toggle) {
            container.classList.toggle('tree-expanded');
            container.classList.toggle('tree-collapsed');
            const isExpanded = container.classList.contains('tree-expanded');
            toggle.setAttribute('aria-expanded', isExpanded.toString());
        }

        function formatKeyValue(key, valueHtml) {
            if (key !== null) {
                const keyStr = typeof key === 'number' ? key : `"${escapeHtml(String(key))}"`;
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

        function formatJson() {
            try {
                setLoading(formatBtn, true);
                const data = JSON.parse(input.value);
                input.value = JSON.stringify(data, null, 2);
                parseAndRender();
                showToast('JSON formatted');
            } catch (e) {
                errorEl.textContent = e.message;
                errorEl.classList.add('visible');
                showToast('Invalid JSON', 'error');
            } finally {
                setLoading(formatBtn, false);
            }
        }

        function minifyJson() {
            try {
                setLoading(minifyBtn, true);
                const data = JSON.parse(input.value);
                input.value = JSON.stringify(data);
                parseAndRender();
                showToast('JSON minified');
            } catch (e) {
                errorEl.textContent = e.message;
                errorEl.classList.add('visible');
                showToast('Invalid JSON', 'error');
            } finally {
                setLoading(minifyBtn, false);
            }
        }

        function clearJson() {
            input.value = '';
            parseAndRender();
            input.focus();
            showToast('Cleared');
        }

        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(parseAndRender, 150);
        });

        formatBtn.addEventListener('click', formatJson);
        minifyBtn.addEventListener('click', minifyJson);
        clearBtn.addEventListener('click', clearJson);

        // Import file handling
        importBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            setLoading(importBtn, true);
            const reader = new FileReader();
            reader.onload = (event) => {
                input.value = event.target.result;
                parseAndRender();
                input.dispatchEvent(new Event('input'));
                setLoading(importBtn, false);
                showToast(`Imported ${file.name}`);
            };
            reader.onerror = () => {
                errorEl.textContent = 'Error reading file: ' + reader.error.message;
                errorEl.classList.add('visible');
                setLoading(importBtn, false);
                showToast('Import failed', 'error');
            };
            reader.readAsText(file);
            fileInput.value = '';
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Only handle when JSON tab is active or input is focused
            const jsonTabActive = document.getElementById('json-tab')?.classList.contains('active');
            if (!jsonTabActive) return;

            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                formatJson();
            } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                minifyJson();
            } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                clearJson();
            }
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
    }

    // ==================== Markdown Editor ====================

    function initMarkdownEditor() {
        const input = document.getElementById('markdown-input');
        const output = document.getElementById('markdown-output');
        const formatBtn = document.getElementById('format-md');
        const clearBtn = document.getElementById('clear-md');
        const importBtn = document.getElementById('import-md');
        const fileInput = document.getElementById('md-file-input');

        let debounceTimer = null;

        // Add keyboard shortcut hints
        formatBtn.innerHTML = `Format <span class="shortcut">${modKey}+⇧+F</span>`;
        clearBtn.innerHTML = `Clear <span class="shortcut">${modKey}+K</span>`;

        function renderMarkdown() {
            const value = input.value;
            if (!value.trim()) {
                output.innerHTML = `
                    <div class="empty-state" style="opacity: 1; position: relative; transform: none; left: 0; top: 0; padding: 48px;">
                        <div class="empty-state-icon" style="font-size: 36px;">#</div>
                        <div class="empty-state-title">No Markdown to preview</div>
                        <div class="empty-state-hint">
                            Paste Markdown or drag & drop a <kbd>.md</kbd> file<br>
                            Supports GitHub Flavored Markdown
                        </div>
                    </div>
                `;
                return;
            }

            if (typeof marked !== 'undefined') {
                output.innerHTML = marked.parse(value);
            } else {
                output.textContent = value;
            }
        }

        async function formatMarkdown() {
            if (typeof prettier !== 'undefined' && typeof prettierPlugins !== 'undefined') {
                try {
                    setLoading(formatBtn, true);
                    const formatted = await prettier.format(input.value, {
                        parser: 'markdown',
                        plugins: prettierPlugins,
                        proseWrap: 'preserve'
                    });
                    input.value = formatted;
                    renderMarkdown();
                    showToast('Markdown formatted');
                } catch (e) {
                    console.error('Prettier error:', e);
                    showToast('Format failed', 'error');
                } finally {
                    setLoading(formatBtn, false);
                }
            }
        }

        function clearMarkdown() {
            input.value = '';
            renderMarkdown();
            input.focus();
            showToast('Cleared');
        }

        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(renderMarkdown, 150);
        });

        formatBtn.addEventListener('click', formatMarkdown);
        clearBtn.addEventListener('click', clearMarkdown);

        // Import file handling
        importBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            setLoading(importBtn, true);
            const reader = new FileReader();
            reader.onload = (event) => {
                input.value = event.target.result;
                renderMarkdown();
                input.dispatchEvent(new Event('input'));
                setLoading(importBtn, false);
                showToast(`Imported ${file.name}`);
            };
            reader.onerror = () => {
                console.error('Error reading file:', reader.error);
                setLoading(importBtn, false);
                showToast('Import failed', 'error');
            };
            reader.readAsText(file);
            fileInput.value = '';
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const mdTabActive = document.getElementById('markdown-tab')?.classList.contains('active');
            if (!mdTabActive) return;

            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                formatMarkdown();
            } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                clearMarkdown();
            }
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

    // ==================== Drag and Drop ====================

    function initDragAndDrop() {
        const jsonTab = document.getElementById('json-tab');
        const markdownTab = document.getElementById('markdown-tab');
        const jsonInput = document.getElementById('json-input');
        const markdownInput = document.getElementById('markdown-input');

        function setupDropZone(dropZone, input, allowedExtensions, onLoad) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => {
                    dropZone.classList.add('drag-over');
                });
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => {
                    dropZone.classList.remove('drag-over');
                });
            });

            dropZone.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                if (files.length === 0) return;

                const file = files[0];
                const ext = '.' + file.name.split('.').pop().toLowerCase();

                if (!allowedExtensions.includes(ext)) {
                    showToast(`Only ${allowedExtensions.join(', ')} files allowed`, 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    input.value = event.target.result;
                    onLoad();
                    input.dispatchEvent(new Event('input'));
                    showToast(`Loaded ${file.name}`);
                };
                reader.onerror = () => {
                    showToast('Error reading file', 'error');
                };
                reader.readAsText(file);
            });
        }

        // JSON drop zone
        setupDropZone(jsonTab, jsonInput, ['.json'], () => {
            const errorEl = document.getElementById('json-error');
            const value = jsonInput.value.trim();
            try {
                JSON.parse(value);
                errorEl.classList.remove('visible');
            } catch (e) {
                errorEl.textContent = e.message;
                errorEl.classList.add('visible');
            }
            jsonInput.dispatchEvent(new Event('input', { bubbles: true }));
        });

        // Markdown drop zone
        setupDropZone(markdownTab, markdownInput, ['.md', '.markdown', '.txt'], () => {
            markdownInput.dispatchEvent(new Event('input', { bubbles: true }));
        });
    }

    // ==================== Initialize ====================

    document.addEventListener('DOMContentLoaded', () => {
        initTabs();
        initResizablePanels();
        initJsonEditor();
        initMarkdownEditor();
        initDragAndDrop();

        // Focus appropriate input based on active tab
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            const input = activeTab.querySelector('textarea');
            if (input) {
                // Delay focus to ensure everything is rendered
                setTimeout(() => input.focus(), 100);
            }
        }
    });
})();
