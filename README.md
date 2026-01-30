![VibePad](assets/github-banner.png)

# VibePad

A modern Chrome extension that replaces your new tab with a powerful JSON and Markdown editor. Built for developers who vibe while they code.

## Features

- **JSON Editor** - Paste, format, minify, and visualize JSON with an interactive tree view
- **Markdown Editor** - Write and preview GitHub Flavored Markdown in real-time
- **Dark Theme** - Easy on the eyes with an amber accent color scheme
- **Keyboard Shortcuts** - Power user friendly with full keyboard support
- **Resizable Panels** - Drag to adjust editor/preview split
- **Drag & Drop** - Drop `.json` or `.md` files directly into the editor
- **Auto-Save** - Your work persists across sessions
- **Create Claude Skills** - Convert markdown content into Claude Code skill files using the Anthropic API
- **Zero Permissions** - No data collection, works entirely offline

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/vibepad.git
   cd vibepad
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (toggle in top right)

4. Click **Load unpacked** and select the `src/` directory

5. Open a new tab to start using VibePad

### From Chrome Web Store

*Coming soon*

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + 1` | Switch to JSON tab |
| `Cmd/Ctrl + 2` | Switch to Markdown tab |
| `Cmd/Ctrl + Shift + F` | Format code |
| `Cmd/Ctrl + Shift + M` | Minify JSON |
| `Cmd/Ctrl + Shift + S` | Create Claude Skill (Markdown tab) |
| `Cmd/Ctrl + K` | Clear editor |

## Screenshots

### JSON Editor
- Syntax-highlighted tree view
- Collapsible nodes with item/key counts
- Real-time validation with error messages

### Markdown Editor
- Live preview with GitHub Flavored Markdown
- Support for tables, code blocks, and more
- Prettier formatting integration

## Create Claude Skills

VibePad can convert your markdown content into properly formatted [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skill files using the Anthropic API.

### Setup

1. Open VibePad settings (gear icon)
2. Enter your Anthropic API key in the **API Settings** section
3. Click **Save API Key**

### Usage

1. Write or paste your skill instructions in the Markdown editor
2. Click the **Create Skill** button or press `Cmd/Ctrl + Shift + S`
3. The AI will convert your markdown into a properly formatted skill file
4. Copy the generated skill to your Claude Code skills directory

## Tech Stack

- **Manifest V3** - Modern Chrome extension architecture
- **Vanilla JS** - No framework dependencies
- **JetBrains Mono** - Beautiful monospace typography
- **Marked.js** - Fast Markdown parsing
- **Prettier** - Code formatting

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test
```

### Project Structure

```
src/
├── manifest.json        # Extension manifest (MV3)
├── newtab.html          # Main editor page
├── options.html         # Settings page
├── js/
│   ├── newtab.js        # Editor logic
│   ├── background.js    # Service worker
│   ├── options.js       # Settings logic
│   └── api-settings.js  # Anthropic API key management
├── css/
│   ├── newtab.css       # Editor styles
│   ├── options.css      # Settings styles
│   └── color-themes/    # Theme files
└── images/icons/        # Extension icons
```

## Color Palette

| Token | Color | Usage |
|-------|-------|-------|
| Background | `#000000` | Main background |
| Panel | `#0a0a0a` | Panel backgrounds |
| Border | `#1f1f1f` | Borders, dividers |
| Text | `#ffffff` | Primary text |
| Muted | `#9ca3af` | Secondary text |
| Accent | `#f59e0b` | Highlights, active states |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Made with vibes by developers, for developers.
