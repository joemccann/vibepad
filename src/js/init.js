/**
 * Auto-click JSON Editor button and focus editor after main.js initializes
 * This must be an external file due to Manifest V3 CSP restrictions
 */
(function() {
    let clicked = false;

    function focusEditor() {
        // Try to focus CodeMirror editor
        const cmEditor = document.querySelector('.CodeMirror');
        if (cmEditor && cmEditor.CodeMirror) {
            cmEditor.CodeMirror.focus();
            console.log('[Init] Focused CodeMirror editor');
            return true;
        }

        // Try textarea or contenteditable as fallback
        const textarea = document.querySelector('.json-editor textarea, .editor textarea');
        if (textarea) {
            textarea.focus();
            console.log('[Init] Focused textarea editor');
            return true;
        }

        const editable = document.querySelector('[contenteditable="true"]');
        if (editable) {
            editable.focus();
            console.log('[Init] Focused contenteditable editor');
            return true;
        }

        return false;
    }

    function clickJsonEditor() {
        if (clicked) return true;

        // Try multiple selectors to find the JSON Editor button
        const selectors = [
            '.action-area .menus li a',
            '.menus li a',
            'ul.menus li a',
            '[class*="menu"] a'
        ];

        for (const selector of selectors) {
            const items = document.querySelectorAll(selector);
            for (const item of items) {
                const text = item.textContent || item.innerText || '';
                if (text.includes('JSON Editor')) {
                    item.click();
                    clicked = true;
                    console.log('[Init] Clicked JSON Editor:', item);
                    // Focus editor after a short delay to let it render
                    setTimeout(focusEditor, 100);
                    setTimeout(focusEditor, 300);
                    return true;
                }
            }
        }

        // Also try finding by span with class menu-label
        const spans = document.querySelectorAll('span.menu-label, .menu-label');
        for (const span of spans) {
            if (span.textContent.trim() === 'JSON Editor') {
                const parent = span.closest('a') || span.parentElement;
                if (parent) {
                    parent.click();
                    clicked = true;
                    console.log('[Init] Clicked JSON Editor via span:', parent);
                    // Focus editor after a short delay to let it render
                    setTimeout(focusEditor, 100);
                    setTimeout(focusEditor, 300);
                    return true;
                }
            }
        }

        return false;
    }

    // Use MutationObserver to detect when menu is added
    const observer = new MutationObserver((mutations) => {
        if (clickJsonEditor()) {
            observer.disconnect();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also try with intervals as backup
    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        if (clickJsonEditor() || attempts > 50) {
            clearInterval(interval);
            observer.disconnect();
        }
    }, 100);

    // Final attempt after longer delay
    setTimeout(() => {
        clickJsonEditor();
    }, 2000);
})();
