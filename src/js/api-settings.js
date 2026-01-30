/**
 * VibePad - API Settings Handler
 * Manages Anthropic API key storage and retrieval
 */
(function() {
    'use strict';

    const API_KEY_STORAGE_KEY = 'anthropicApiKey';

    function showToast(message) {
        const toast = document.querySelector('.tost-message');
        if (toast) {
            toast.querySelector('.text').textContent = message;
            toast.classList.add('active');
            setTimeout(() => {
                toast.classList.remove('active');
            }, 2500);
        }
    }

    async function loadApiKey() {
        try {
            const result = await chrome.storage.local.get([API_KEY_STORAGE_KEY]);
            const apiKey = result[API_KEY_STORAGE_KEY];
            const input = document.getElementById('anthropic-api-key');

            if (input && apiKey) {
                // Show masked version of the key
                input.value = apiKey;
                input.placeholder = 'API key saved';
            }
        } catch (e) {
            console.error('Error loading API key:', e);
        }
    }

    async function saveApiKey() {
        const input = document.getElementById('anthropic-api-key');
        if (!input) return;

        const apiKey = input.value.trim();

        if (!apiKey) {
            showToast('Please enter an API key');
            return;
        }

        if (!apiKey.startsWith('sk-ant-')) {
            showToast('Invalid API key format');
            return;
        }

        try {
            await chrome.storage.local.set({ [API_KEY_STORAGE_KEY]: apiKey });
            showToast('API key saved successfully');
        } catch (e) {
            console.error('Error saving API key:', e);
            showToast('Error saving API key');
        }
    }

    async function clearApiKey() {
        const input = document.getElementById('anthropic-api-key');

        try {
            await chrome.storage.local.remove([API_KEY_STORAGE_KEY]);
            if (input) {
                input.value = '';
                input.placeholder = 'sk-ant-api03-...';
            }
            showToast('API key cleared');
        } catch (e) {
            console.error('Error clearing API key:', e);
            showToast('Error clearing API key');
        }
    }

    function init() {
        const saveBtn = document.getElementById('save-api-key');
        const clearBtn = document.getElementById('clear-api-key');

        if (saveBtn) {
            saveBtn.addEventListener('click', saveApiKey);
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', clearApiKey);
        }

        // Load existing API key on page load
        loadApiKey();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
