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

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function generateFilename(content, extension) {
        // Try to extract a meaningful name from content
        let name = 'vibepad';

        if (extension === 'json') {
            try {
                const data = JSON.parse(content);
                // Try common identifier fields
                if (data.name) name = String(data.name).slice(0, 30);
                else if (data.title) name = String(data.title).slice(0, 30);
                else if (data.id) name = String(data.id).slice(0, 30);
            } catch (e) {}
        } else if (extension === 'md') {
            // Try to extract first heading
            const headingMatch = content.match(/^#\s+(.+)$/m);
            if (headingMatch) {
                name = headingMatch[1].slice(0, 30);
            }
        }

        // Sanitize filename
        name = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            || 'vibepad';

        // Add timestamp for uniqueness
        const timestamp = new Date().toISOString().slice(0, 10);
        return `${name}-${timestamp}.${extension}`;
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
        const downloadBtn = document.getElementById('download-json');
        const fileInput = document.getElementById('json-file-input');

        let debounceTimer = null;

        // Add keyboard shortcut hints
        formatBtn.innerHTML = `Format <span class="shortcut">${modKey}+⇧+F</span>`;
        minifyBtn.innerHTML = `Minify <span class="shortcut">${modKey}+⇧+M</span>`;
        clearBtn.innerHTML = `Clear <span class="shortcut">${modKey}+K</span>`;
        downloadBtn.innerHTML = `Download <span class="shortcut">${modKey}+⇧+D</span>`;

        function parseAndRender() {
            const value = input.value.trim();

            if (!value) {
                treeView.innerHTML = `
                    <div class="empty-state" style="opacity: 1;">
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

        function downloadJson() {
            const content = input.value.trim();
            if (!content) {
                showToast('Nothing to download', 'error');
                return;
            }

            // Validate JSON before downloading
            try {
                JSON.parse(content);
            } catch (e) {
                showToast('Fix JSON errors before downloading', 'error');
                return;
            }

            const filename = generateFilename(content, 'json');
            downloadFile(content, filename, 'application/json');
            showToast(`Downloaded ${filename}`);
        }

        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(parseAndRender, 150);
        });

        formatBtn.addEventListener('click', formatJson);
        minifyBtn.addEventListener('click', minifyJson);
        clearBtn.addEventListener('click', clearJson);
        downloadBtn.addEventListener('click', downloadJson);

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
            } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                downloadJson();
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
        const downloadBtn = document.getElementById('download-md');
        const fileInput = document.getElementById('md-file-input');

        let debounceTimer = null;

        // Add keyboard shortcut hints
        formatBtn.innerHTML = `Format <span class="shortcut">${modKey}+⇧+F</span>`;
        clearBtn.innerHTML = `Clear <span class="shortcut">${modKey}+K</span>`;
        downloadBtn.innerHTML = `Download <span class="shortcut">${modKey}+⇧+D</span>`;

        function renderMarkdown() {
            const value = input.value;
            if (!value.trim()) {
                output.innerHTML = `
                    <div class="empty-state" style="opacity: 1;">
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

        function downloadMarkdown() {
            const content = input.value.trim();
            if (!content) {
                showToast('Nothing to download', 'error');
                return;
            }

            const filename = generateFilename(content, 'md');
            downloadFile(content, filename, 'text/markdown');
            showToast(`Downloaded ${filename}`);
        }

        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(renderMarkdown, 150);
        });

        formatBtn.addEventListener('click', formatMarkdown);
        clearBtn.addEventListener('click', clearMarkdown);
        downloadBtn.addEventListener('click', downloadMarkdown);

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
            } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                downloadMarkdown();
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

    // ==================== Claude Skill Creation ====================

    const SKILL_SYSTEM_PROMPT = `You are a Claude Code skill converter. Convert the user's markdown into a Claude Code skill file.

A skill has:
1. YAML frontmatter (--- markers) with:
   - name: kebab-case (required)
   - description: 1-2 sentence purpose (required)
   - disable-model-invocation: true|false (optional)
   - allowed-tools: Read, Grep, etc. (optional)
2. Markdown body with instructions

Guidelines:
- Extract clear name from content
- Write concise description
- Preserve user's original instructions
- Add structure improvements if needed

Output ONLY the skill file content starting with --- frontmatter.`;

    async function getAnthropicApiKey() {
        try {
            const result = await chrome.storage.local.get(['anthropicApiKey']);
            return result.anthropicApiKey || null;
        } catch (e) {
            console.error('Error retrieving API key:', e);
            return null;
        }
    }

    async function callAnthropicApi(apiKey, content) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4096,
                system: SKILL_SYSTEM_PROMPT,
                messages: [{ role: 'user', content: content }]
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            if (response.status === 401) {
                throw new Error('Invalid API key. Check your settings.');
            }
            throw new Error(error.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    function showApiKeyModal() {
        // Create modal if it doesn't exist
        let overlay = document.querySelector('.modal-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h3>API Key Required</h3>
                        <button class="modal-close" aria-label="Close">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>To use the Create Skill feature, you need to configure your Anthropic API key.</p>
                        <p>You can add your API key in <a href="options.html#api-settings" target="_blank">Settings → API Settings</a>.</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary modal-cancel">Cancel</button>
                        <button class="btn-primary modal-settings">Open Settings</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            // Event listeners
            overlay.querySelector('.modal-close').addEventListener('click', hideModal);
            overlay.querySelector('.modal-cancel').addEventListener('click', hideModal);
            overlay.querySelector('.modal-settings').addEventListener('click', () => {
                window.open('options.html#api-settings', '_blank');
                hideModal();
            });
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) hideModal();
            });
        }

        // Show modal
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
    }

    function hideModal() {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
        }
    }

    async function handleCreateSkill() {
        const input = document.getElementById('markdown-input');
        const createBtn = document.getElementById('create-skill');
        const content = input?.value.trim();

        if (!content) {
            showToast('Enter some markdown content first', 'error');
            return;
        }

        const apiKey = await getAnthropicApiKey();
        if (!apiKey) {
            showApiKeyModal();
            return;
        }

        try {
            setLoading(createBtn, true);
            const skillContent = await callAnthropicApi(apiKey, content);
            input.value = skillContent;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            showToast('Skill created successfully');
        } catch (e) {
            console.error('Error creating skill:', e);
            showToast(e.message || 'Error creating skill', 'error');
        } finally {
            setLoading(createBtn, false);
        }
    }

    function initClaudeSkillCreation() {
        const createBtn = document.getElementById('create-skill');

        if (createBtn) {
            // Add keyboard shortcut hint
            createBtn.innerHTML = `Create Skill <span class="shortcut">${modKey}+⇧+S</span>`;

            createBtn.addEventListener('click', handleCreateSkill);
        }

        // Keyboard shortcut (Cmd/Ctrl + Shift + S)
        document.addEventListener('keydown', (e) => {
            const mdTabActive = document.getElementById('markdown-tab')?.classList.contains('active');
            if (!mdTabActive) return;

            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handleCreateSkill();
            }
        });
    }

    // ==================== Scroll Sync ====================

    function initScrollSync() {
        // Scroll sync state
        let scrollSyncEnabled = true;
        let isScrolling = false;
        let scrollTimeout = null;

        // Throttle function for performance (~60fps)
        function throttle(fn, delay = 16) {
            let lastCall = 0;
            return function(...args) {
                const now = Date.now();
                if (now - lastCall >= delay) {
                    lastCall = now;
                    fn.apply(this, args);
                }
            };
        }

        // Calculate and apply scroll sync
        function syncScroll(source, target) {
            if (!scrollSyncEnabled || isScrolling) return;

            const sourceScrollable = source.scrollHeight - source.clientHeight;
            if (sourceScrollable <= 0) return;

            const scrollPercentage = source.scrollTop / sourceScrollable;
            const targetScrollable = target.scrollHeight - target.clientHeight;

            isScrolling = true;
            target.scrollTop = scrollPercentage * targetScrollable;

            // Reset flag after scroll completes
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
            }, 50);
        }

        // Create toggle button for panel header
        function createScrollSyncToggle() {
            const toggle = document.createElement('button');
            toggle.className = 'scroll-sync-toggle active';
            toggle.title = 'Toggle scroll sync';
            toggle.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="17 1 21 5 17 9"></polyline>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                    <polyline points="7 23 3 19 7 15"></polyline>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                </svg>
                <span>Sync</span>
            `;
            toggle.addEventListener('click', () => {
                scrollSyncEnabled = !scrollSyncEnabled;
                toggle.classList.toggle('active', scrollSyncEnabled);
                toggle.title = scrollSyncEnabled ? 'Scroll sync enabled' : 'Scroll sync disabled';

                // Update all toggle buttons
                document.querySelectorAll('.scroll-sync-toggle').forEach(btn => {
                    btn.classList.toggle('active', scrollSyncEnabled);
                    btn.title = scrollSyncEnabled ? 'Scroll sync enabled' : 'Scroll sync disabled';
                });

                showToast(scrollSyncEnabled ? 'Scroll sync enabled' : 'Scroll sync disabled');
            });
            return toggle;
        }

        // Setup JSON scroll sync
        const jsonInput = document.getElementById('json-input');
        const jsonTree = document.getElementById('json-tree');
        if (jsonInput && jsonTree) {
            const throttledJsonSync = throttle(() => syncScroll(jsonInput, jsonTree));
            jsonInput.addEventListener('scroll', throttledJsonSync);

            // Add toggle to JSON preview panel header
            const jsonPreviewHeader = document.querySelector('#json-tab .preview-panel .panel-header');
            if (jsonPreviewHeader) {
                const toggle = createScrollSyncToggle();
                jsonPreviewHeader.appendChild(toggle);
            }
        }

        // Setup Markdown scroll sync
        const mdInput = document.getElementById('markdown-input');
        const mdOutput = document.getElementById('markdown-output');
        if (mdInput && mdOutput) {
            const throttledMdSync = throttle(() => syncScroll(mdInput, mdOutput));
            mdInput.addEventListener('scroll', throttledMdSync);

            // Add toggle to Markdown preview panel header
            const mdPreviewHeader = document.querySelector('#markdown-tab .preview-panel .panel-header');
            if (mdPreviewHeader) {
                const toggle = createScrollSyncToggle();
                mdPreviewHeader.appendChild(toggle);
            }
        }

        // Load saved preference
        try {
            const saved = localStorage.getItem('scrollSyncEnabled');
            if (saved !== null) {
                scrollSyncEnabled = saved === 'true';
                document.querySelectorAll('.scroll-sync-toggle').forEach(btn => {
                    btn.classList.toggle('active', scrollSyncEnabled);
                    btn.title = scrollSyncEnabled ? 'Scroll sync enabled' : 'Scroll sync disabled';
                });
            }
        } catch (e) {}

        // Save preference on toggle
        document.querySelectorAll('.scroll-sync-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                try {
                    localStorage.setItem('scrollSyncEnabled', scrollSyncEnabled);
                } catch (e) {}
            });
        });
    }

    // ==================== Initialize ====================

    function initDocumentStorage() {
        const toggleBtn = document.getElementById('toggle-docs');
        const closeBtn = document.getElementById('close-docs');
        const drawer = document.getElementById('docs-drawer');
        const docsList = document.getElementById('docs-list');
        const saveJsonBtn = document.getElementById('save-json');
        const saveMdBtn = document.getElementById('save-md');

        // Drawer toggle
        toggleBtn.addEventListener('click', () => {
            drawer.classList.toggle('open');
            if (drawer.classList.contains('open')) {
                loadDocuments();
                toggleBtn.classList.add('active');
            } else {
                toggleBtn.classList.remove('active');
            }
        });

        closeBtn.addEventListener('click', () => {
            drawer.classList.remove('open');
            toggleBtn.classList.remove('active');
        });

        // Close drawer on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && drawer.classList.contains('open')) {
                drawer.classList.remove('open');
                toggleBtn.classList.remove('active');
            }
        });

        async function saveDocument(type) {
            const input = document.getElementById(type === 'json' ? 'json-input' : 'markdown-input');
            const content = input.value.trim();
            const saveBtn = type === 'json' ? saveJsonBtn : saveMdBtn;

            if (!content) {
                showToast('Nothing to save', 'error');
                return;
            }

            if (type === 'json') {
                try {
                    JSON.parse(content);
                } catch (e) {
                    showToast('Invalid JSON content', 'error');
                    return;
                }
            }

            try {
                setLoading(saveBtn, true);
                const title = generateDocumentTitle(content, type === 'json' ? 'json' : 'md');
                const id = Date.now().toString();
                const doc = {
                    id,
                    type,
                    title,
                    content,
                    timestamp: new Date().toISOString()
                };

                const result = await chrome.storage.local.get(['savedDocs']);
                const savedDocs = result.savedDocs || [];
                savedDocs.unshift(doc);
                
                // Limit to 50 docs
                if (savedDocs.length > 50) savedDocs.pop();

                await chrome.storage.local.set({ savedDocs });
                showToast(`Saved "${title}"`);
                
                if (drawer.classList.contains('open')) {
                    loadDocuments();
                }
            } catch (e) {
                console.error('Error saving document:', e);
                showToast('Save failed', 'error');
            } finally {
                setLoading(saveBtn, false);
            }
        }

        function generateDocumentTitle(content, extension) {
            let name = 'Untitled';
            if (extension === 'json') {
                try {
                    const data = JSON.parse(content);
                    if (data.name) name = String(data.name).slice(0, 30);
                    else if (data.title) name = String(data.title).slice(0, 30);
                } catch (e) {}
            } else {
                const headingMatch = content.match(/^#\s+(.+)$/m);
                if (headingMatch) {
                    name = headingMatch[1].slice(0, 30);
                }
            }
            return name === 'Untitled' ? `${extension.toUpperCase()} Doc` : name;
        }

        async function loadDocuments() {
            try {
                const result = await chrome.storage.local.get(['savedDocs']);
                const docs = result.savedDocs || [];
                
                if (docs.length === 0) {
                    docsList.innerHTML = `
                        <div class="empty-docs">
                            No saved documents yet.<br>
                            Click "Save" in the editor to keep a local copy.
                        </div>
                    `;
                    return;
                }

                docsList.innerHTML = '';
                docs.forEach(doc => {
                    const date = new Date(doc.timestamp).toLocaleDateString();
                    const item = document.createElement('div');
                    item.className = 'doc-item';
                    item.innerHTML = `
                        <div class="doc-title">${escapeHtml(doc.title)}</div>
                        <div class="doc-meta">
                            <span class="doc-type doc-type-${doc.type}">${doc.type.toUpperCase()}</span>
                            ${date}
                        </div>
                        <button class="doc-delete" title="Delete">&times;</button>
                    `;

                    item.addEventListener('click', (e) => {
                        if (e.target.classList.contains('doc-delete')) {
                            e.stopPropagation();
                            deleteDocument(doc.id);
                        } else {
                            openDocument(doc);
                        }
                    });

                    docsList.appendChild(item);
                });
            } catch (e) {
                console.error('Error loading documents:', e);
                docsList.innerHTML = '<div class="empty-docs">Error loading documents</div>';
            }
        }

        async function deleteDocument(id) {
            if (!confirm('Are you sure you want to delete this document?')) return;
            
            try {
                const result = await chrome.storage.local.get(['savedDocs']);
                const savedDocs = result.savedDocs || [];
                const updatedDocs = savedDocs.filter(d => d.id !== id);
                await chrome.storage.local.set({ savedDocs: updatedDocs });
                loadDocuments();
                showToast('Document deleted');
            } catch (e) {
                showToast('Delete failed', 'error');
            }
        }

        function openDocument(doc) {
            const tabBtn = document.querySelector(`.tab-btn[data-tab="${doc.type}"]`);
            if (tabBtn) tabBtn.click();

            const input = document.getElementById(doc.type === 'json' ? 'json-input' : 'markdown-input');
            if (input) {
                input.value = doc.content;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                showToast(`Loaded "${doc.title}"`);
                
                // On mobile, close drawer after loading
                if (window.innerWidth <= 768) {
                    drawer.classList.remove('open');
                    toggleBtn.classList.remove('active');
                }
            }
        }

        function escapeHtml(str) {
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        saveJsonBtn.addEventListener('click', () => saveDocument('json'));
        saveMdBtn.addEventListener('click', () => saveDocument('markdown'));

        // Keyboard shortcuts for saving
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's' && !e.shiftKey) {
                const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
                if (activeTab === 'json' || activeTab === 'markdown') {
                    e.preventDefault();
                    saveDocument(activeTab);
                }
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initTabs();
        initResizablePanels();
        initJsonEditor();
        initMarkdownEditor();
        initDragAndDrop();
        initClaudeSkillCreation();
        initScrollSync();
        initDocumentStorage();

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
