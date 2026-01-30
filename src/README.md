# VibePad

A Chrome extension that replaces your new tab page with a JSON and Markdown editor.

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `src/` directory from this project

## Features

- **New Tab Replacement**: Every new tab opens the editor interface
- **JSON Editor**: Interactive tree view, format, minify, and validate JSON
- **Markdown Editor**: Live preview with GitHub Flavored Markdown support
- **Create Claude Skills**: Convert markdown to Claude Code skill files using the Anthropic API
- **Themes**: Dark (default), Light (MDN-style), and System (auto-detect)
- **Theme Auto-Save**: Theme changes save immediately without clicking submit
- **Custom CSS**: Add your own styling
- **URL Filtering**: Disable the extension on specific URLs
- **Drag & Drop**: Import .json and .md files directly
- **Auto-Save**: Content persists across sessions

## Configuration

Access settings via the gear icon in the top right corner of the new tab page.

### Settings Options

| Setting | Description |
|---------|-------------|
| Theme | Dark, Light (MDN), or System (auto-detect) |
| Custom CSS | Add custom styles to the editor |
| Collapse nested items | Start with JSON nodes collapsed |
| JSON Detection Method | Content-Type based or JSON content parsing |
| URL Manager | Disable extension on specific URLs |
| API Settings | Configure Anthropic API key for Claude Skills |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + 1` | Switch to JSON tab |
| `Cmd/Ctrl + 2` | Switch to Markdown tab |
| `Cmd/Ctrl + Shift + F` | Format code |
| `Cmd/Ctrl + Shift + M` | Minify JSON |
| `Cmd/Ctrl + Shift + S` | Create Claude Skill |
| `Cmd/Ctrl + K` | Clear editor |

## Development

### Run Tests

```bash
npm install
npm test
```

### Project Structure

```
src/
├── manifest.json        # Extension manifest (Manifest V3)
├── newtab.html          # New tab page (JSON & Markdown editor)
├── options.html         # Settings page
├── js/
│   ├── newtab.js        # Main editor logic
│   ├── background.js    # Service worker
│   ├── api-settings.js  # Anthropic API key management
│   ├── theme-init.js    # Theme initialization and auto-save
│   ├── options-theme.js # Options page theme listener
│   ├── contentScript.js # Page injection script
│   └── options.js       # Settings page logic
├── css/
│   ├── newtab.css       # Editor styles
│   ├── options.css      # Settings page styles
│   └── color-themes/    # Theme files
├── images/icons/        # Extension icons
└── tests/               # Jest tests
```
