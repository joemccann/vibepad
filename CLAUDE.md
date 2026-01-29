# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome Extension (Manifest V3) project for viewing and formatting JSON content.

- **`src/`** - The main extension that replaces Chrome's new tab with a JSON viewer
- **`reference/`** - Original "JSON Viewer Pro" extension used as reference (do not modify)

## Commands

```bash
npm install    # Install dependencies
npm test       # Run extension structure tests (23 tests)
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
├── index.html           # New tab page (JSON viewer)
├── options.html         # Settings page
├── js/
│   ├── background.js    # Service worker (no toolbar icon handler)
│   ├── main.js          # React JSON viewer app
│   ├── contentScript.js # Page injection for JSON detection
│   └── options.js       # Settings logic
├── css/                 # Styles and themes
├── images/icons/        # Extension icons
└── tests/               # Jest tests
```

**Key difference from reference**: Uses `chrome_url_override.newtab` instead of `action` - no toolbar icon, new tab is the JSON viewer.

### Key Extension Patterns

**Message Passing Flow:**
1. Content script requests options via `chrome.runtime.sendMessage({ action: 'give_me_options' })`
2. Background service worker retrieves from `chrome.storage.local` and broadcasts to all tabs
3. Options stored under key `rb-awesome-json-viewer-options`

**JSON Detection Strategies (configurable):**
- `contentType`: Match response Content-Type against allowed MIME types
- `jsonContent`: Parse page content regardless of Content-Type

**Theming:**
- Two themes: `default` (dark-pro.css) and `mdn` (mdn-light.css)
- Custom CSS support via options
- CSS variables defined in color theme files

**URL Filtering:**
- Users can disable extension on specific URLs
- Stored in `filteredURL` array in options

### Storage Schema

```javascript
{
  theme: 'default' | 'mdn',
  css: string,           // custom CSS
  collapsed: 0 | 1,      // collapse nested items by default
  filteredURL: string[], // URLs to exclude
  jsonDetection: {
    method: 'contentType' | 'jsonContent',
    selectedContentTypes: string[]
  }
}
```
