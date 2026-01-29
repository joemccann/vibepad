/**
 * Theme initialization script
 * Applies stored theme preference immediately to prevent flash of wrong theme
 * Must be loaded early in the document head
 */

const DB_NAME = 'rb-awesome-json-viewer-options';

// Apply theme based on stored preference
async function initTheme() {
    try {
        const data = await chrome.storage.local.get([DB_NAME]);
        let options = data[DB_NAME];
        if (typeof options === 'string') {
            options = JSON.parse(options);
        }
        const theme = (options && options.theme) || 'default';
        applyTheme(theme);
    } catch (e) {
        // Default to dark theme on error
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

// Map theme value to data-theme attribute
function applyTheme(theme) {
    if (theme === 'mdn') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else if (theme === 'system') {
        document.documentElement.setAttribute('data-theme', 'system');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

// Listen for system theme changes when using 'system' setting
function setupSystemThemeListener() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => {
        try {
            const data = await chrome.storage.local.get([DB_NAME]);
            let options = data[DB_NAME];
            if (typeof options === 'string') options = JSON.parse(options);
            if (options && options.theme === 'system') {
                // Force re-evaluation by toggling attribute
                document.documentElement.removeAttribute('data-theme');
                document.documentElement.setAttribute('data-theme', 'system');
            }
        } catch (e) {
            // Ignore errors
        }
    });
}

// Setup theme dropdown listener (for options page)
function setupThemeDropdownListener() {
    document.addEventListener('DOMContentLoaded', function() {
        const themeSelect = document.getElementById('theme');
        if (themeSelect) {
            themeSelect.addEventListener('change', function() {
                applyTheme(this.value);
            });
        }
    });
}

// Initialize
initTheme();
setupSystemThemeListener();

// Export for options page to use dropdown listener
if (typeof window !== 'undefined') {
    window.setupThemeDropdownListener = setupThemeDropdownListener;
}
