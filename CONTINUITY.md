# Continuity Ledger

## Goal
Add Markdown tab and auto-show JSON editor on new tab. Success criteria:
- JSON Editor automatically visible when opening new tab
- Tab UI with "JSON" and "Markdown" tabs
- Markdown tab: paste markdown, auto-cleanup, render preview
- Tests updated

## Constraints/Assumptions
- main.js is pre-bundled React (930KB) - cannot modify internals
- Use CDN for marked.js (markdown parser)
- No build system - vanilla JS/CSS approach
- Must work as Chrome extension

## Key Decisions
- Separate newtab.html approach: main.js uses inline scripts that MV3 CSP blocks in extension pages
- main.js still used for JSON detection on web pages (via content script)
- newtab.html has custom JSON tree viewer + Markdown editor (no React dependency)
- Use marked.js for Markdown rendering, Prettier for formatting

## State

### Done
- Created feature branch: feature/markdown-tab-and-auto-editor
- Analyzed codebase structure
- Discovered MV3 CSP blocks main.js inline scripts in extension pages
- Created separate newtab.html with custom JSON/Markdown editor (no main.js dependency)
- Created newtab.css and newtab.js with full functionality
- Added file import feature: Import buttons + drag-and-drop support

### Now
- Committing file import feature

### Next
- Browser testing
- PR

## Open Questions
- None

## Working Set
- src/newtab.html - new tab page (custom editor)
- src/js/newtab.js - new tab logic
- src/css/newtab.css - new tab styles
- src/index.html - JSON viewer page (for content script injection)
- src/js/main.js - bundled JSON viewer (read-only, used by content script)
- src/tests/extension.test.js - tests
