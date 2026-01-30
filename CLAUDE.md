# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome Extension (Manifest V3) that replaces the new tab with a JSON and Markdown editor.

- **`src/`** - The main extension with JSON viewer, Markdown editor, and Claude Skills creator
- **`reference/`** - Original "JSON Viewer Pro" extension used as reference (do not modify)

## Commands

```bash
npm install    # Install dependencies
npm test       # Run extension structure tests (51 tests)
```

## Loading the Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → select `src/` directory

## Architecture

### Main Extension (src/)

The new tab replacement extension with this structure:

```
src/
├── manifest.json        # Manifest V3 with chrome_url_override.newtab
├── newtab.html          # New tab page (JSON/Markdown editor)
├── options.html         # Settings page
├── js/
│   ├── newtab.js        # Main editor logic (tabs, JSON, Markdown, Claude Skills)
│   ├── background.js    # Service worker
│   ├── options.js       # Settings logic (minified)
│   ├── api-settings.js  # Anthropic API key management
│   ├── theme-init.js    # Theme initialization and auto-save
│   ├── options-theme.js # Options page theme listener setup
│   ├── tabs.js          # Tab switching logic
│   ├── markdown.js      # Markdown utilities
│   └── contentScript.js # Page injection for JSON detection
├── css/
│   ├── newtab.css       # Editor styles
│   ├── options.css      # Settings styles
│   └── color-themes/    # Theme files (dark-pro.css, mdn-light.css)
├── images/icons/        # Extension icons
└── tests/               # Jest tests
```

**Key difference from reference**: Uses `chrome_url_override.newtab` instead of `action` - no toolbar icon, new tab is the editor.

### Key Extension Patterns

**Message Passing Flow:**
1. Content script requests options via `chrome.runtime.sendMessage({ action: 'give_me_options' })`
2. Background service worker retrieves from `chrome.storage.local` and broadcasts to all tabs
3. Options stored under key `rb-awesome-json-viewer-options`

**JSON Detection Strategies (configurable):**
- `contentType`: Match response Content-Type against allowed MIME types
- `jsonContent`: Parse page content regardless of Content-Type

**Theming:**
- Three themes: `default` (dark-pro.css), `mdn` (mdn-light.css), and `system` (auto-detects OS preference)
- Theme changes auto-save immediately (no submit button required)
- Custom CSS support via options
- CSS variables defined in color theme files
- Theme logic in `theme-init.js` handles initialization, application, and persistence

**URL Filtering:**
- Users can disable extension on specific URLs
- Stored in `filteredURL` array in options

**Create Claude Skills:**
- Converts markdown content into Claude Code skill files using the Anthropic API
- Requires user's Anthropic API key (stored locally in browser)
- API key management in `api-settings.js`
- Keyboard shortcut: `Cmd/Ctrl + Shift + S`

### Storage Schema

```javascript
{
  theme: 'default' | 'mdn' | 'system',  // 'system' auto-detects OS preference
  css: string,           // custom CSS
  collapsed: 0 | 1,      // collapse nested items by default
  filteredURL: string[], // URLs to exclude
  jsonDetection: {
    method: 'contentType' | 'jsonContent',
    selectedContentTypes: string[]
  },
  anthropicApiKey: string  // API key for Create Claude Skills feature
}
```

## Aliases

- **cmbp**: Commit, Merge to main, Bump version, Push to origin
