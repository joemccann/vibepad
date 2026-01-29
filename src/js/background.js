const dbName = 'rb-awesome-json-viewer-options';

const RB_DOWNLOAD_JSON_MENU = 'RB_DOWNLOAD_JSON_MENU';
const RB_OPEN_SETTINGS = 'RB_OPEN_SETTINGS';

// Valid option keys - filter out any legacy/corrupted data
const VALID_OPTION_KEYS = ['theme', 'css', 'collapsed', 'filteredURL', 'jsonDetection'];

// Sanitize options to remove any invalid/legacy data that could cause JSON parse errors
const sanitizeOptions = (options) => {
    if (!options || typeof options !== 'object') {
        return {};
    }
    const sanitized = {};
    for (const key of VALID_OPTION_KEYS) {
        if (key in options) {
            sanitized[key] = options[key];
        }
    }
    return sanitized;
};

// Clear corrupted storage data and reset to defaults
const clearCorruptedData = async () => {
    try {
        const data = await chrome.storage.local.get([dbName]);
        const existingData = data[dbName];

        // Check if data exists and is potentially corrupted
        if (existingData) {
            let needsReset = false;

            if (typeof existingData === 'string') {
                try {
                    const parsed = JSON.parse(existingData);
                    if (typeof parsed !== 'object' || parsed === null) {
                        needsReset = true;
                    }
                } catch (e) {
                    needsReset = true;
                }
            } else if (typeof existingData !== 'object') {
                needsReset = true;
            }

            if (needsReset) {
                console.log('Clearing corrupted options data');
                await chrome.storage.local.remove([dbName]);
            }
        }
    } catch (e) {
        console.error('Error clearing corrupted data:', e);
    }
};

function genericOnClick(info, tab) {
    switch (info.menuItemId) {
        case RB_DOWNLOAD_JSON_MENU:
            chrome.tabs.sendMessage(tab.id, { action: 'rb_download_json' });
            break;
        case RB_OPEN_SETTINGS:
            chrome.tabs.create({
                url: chrome.runtime.getURL('options.html'),
            });
            break;
    }
}

chrome.contextMenus.onClicked.addListener(genericOnClick);

const createContextMenu = async () => {
    try {
        await chrome.contextMenus.removeAll();
    } catch (error) {
        console.log('Context Menu related Error Found:', error);
    } finally {
        chrome.contextMenus.create({
            id: RB_DOWNLOAD_JSON_MENU,
            title: 'Download JSON',
            contexts: ['all'],
            type: 'normal',
            documentUrlPatterns: ['*://*/*'],
        });

        chrome.contextMenus.create({
            id: RB_OPEN_SETTINGS,
            title: 'Settings',
            contexts: ['all'],
            type: 'normal',
            documentUrlPatterns: ['*://*/*'],
        });
    }
};

const getBackwardCompatibleOptions = async (key) => {
    try {
        const data = await chrome.storage.local.get([key]);
        const existingData = data[key];
        if (existingData && typeof existingData === 'string') {
            try {
                const parsedData = JSON.parse(existingData);
                if (parsedData && Object.keys(parsedData).length > 0) {
                    return parsedData;
                }
            } catch (error) {
                console.log('Error while parsing the existing options:', error);
                return;
            }
        }
        return existingData;
    } catch (e) {
        console.error("Your browser doesn't support chrome storage api", e);
    }
    return;
};

const sendOptions = async () => {
    let options = await getBackwardCompatibleOptions(dbName);
    if (!options) {
        options = {};
    }

    // Sanitize options to remove any legacy/corrupted data
    options = sanitizeOptions(options);

    options = {
        ...{
            theme: 'default',
            css: '',
            collapsed: 0,
            filteredURL: [],
            jsonDetection: {
                method: 'contentType',
                selectedContentTypes: [
                    'application/json',
                    'text/json',
                    'application/javascript',
                ],
            },
        },
        ...options,
    };

    options.optionPageURL = chrome.runtime.getURL('options.html');

    try {
        const tabs = await chrome.tabs.query({});
        tabs.forEach(async (tab) => {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'options_received',
                    options: options,
                });
            } catch (error) {}
        });
    } catch (error) {
        console.log(
            'Error Found while sending options from background.js:',
            error,
        );
    }
};

chrome.runtime.onMessage.addListener(async (message) => {
    switch (message.action) {
        case 'give_me_options':
            try {
                await sendOptions();
            } catch (error) {
                console.log('Error Found:', error);
            }
            break;
    }
});

chrome.runtime.onInstalled.addListener(async (details) => {
    if (['install', 'update'].includes(details.reason)) {
        // Clear any corrupted data from previous installations
        await clearCorruptedData();
        createContextMenu();
    }
});
