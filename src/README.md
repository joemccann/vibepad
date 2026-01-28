# JSON Viewer New Tab

A Chrome extension that replaces your new tab page with a JSON viewer and formatter.

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `src/` directory from this project

## Features

- **New Tab Replacement**: Every new tab opens the JSON viewer interface
- **JSON Detection**: Automatically formats JSON on web pages based on content type or content parsing
- **Themes**: Dark (default) and Light (MDN-style) themes
- **Custom CSS**: Add your own styling
- **URL Filtering**: Disable the extension on specific URLs
- **Context Menus**: Right-click to download JSON or access settings

## Configuration

Access settings via:
- Right-click anywhere → "Settings"
- Or navigate to the extension's options page in `chrome://extensions/`

### Settings Options

| Setting | Description |
|---------|-------------|
| Theme | Choose between Dark (default) or MDN Light theme |
| Custom CSS | Add custom styles to the JSON viewer |
| Collapse nested items | Start with JSON nodes collapsed |
| JSON Detection Method | Content-Type based or JSON content parsing |
| URL Manager | Disable extension on specific URLs |

## Development

### Run Tests

```bash
npm install
npm test
```

### Project Structure

```
src/
├── manifest.json       # Extension manifest (Manifest V3)
├── index.html          # New tab page
├── options.html        # Settings page
├── js/
│   ├── background.js   # Service worker
│   ├── main.js         # JSON viewer React app
│   ├── contentScript.js# Page injection script
│   └── options.js      # Settings page logic
├── css/
│   ├── style.css       # Main styles
│   ├── options.css     # Settings page styles
│   ├── codemirror.css  # Editor styles
│   └── color-themes/
│       ├── dark-pro.css
│       └── mdn-light.css
├── images/icons/       # Extension icons
└── tests/
    └── extension.test.js
```

## Differences from Reference Extension

This extension is based on "JSON Viewer Pro" but modified to:

1. **Replace new tab** instead of opening via toolbar icon click
2. **No toolbar icon** - the extension only works as new tab replacement
3. **Same functionality** - all JSON viewing, theming, and settings features preserved
