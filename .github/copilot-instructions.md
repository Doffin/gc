# Copilot instructions for GroundCheck (gc)

This repo is a small static PWA-style web app. The goal of these instructions is to help AI coding agents be productive immediately by documenting the project's structure, conventions, runtime expectations, and important integration points.

Key facts (big picture)
- Static single-page site in the repository root (index.html) with small JS modules in `js/` and language JSON files in `lang/`.
- Progressive Web App surface: `manifest.json` + `sw.js` implement caching and PWA install flows. Service worker caches a named key (`vk_test_v1`).
- Real-time integration: `index.html` opens a WebSocket to `ws://localhost:8080` (see index.html initWebSocket). A local WebSocket server is expected for live data.
- Charting: Chart.js is used via `chart.umd.min.js`. The chart instance is global and is updated by `js/languageLoader.js` when language changes.

Files to inspect first
- `index.html` — main entry, contains the chart initialization, WebSocket client, PWA install hook, and where i18n placeholders (`data-i18n`) are used.
- `js/languageLoader.js` — language loader, interpolation, and update logic for DOM and Chart.js labels. It expects language files at `lang/<name>.json`.
- `sw.js` — service worker with a fixed cache name and a precache list. Look here for cache keys and how offline resources are served.
- `app.js` — PWA install prompt handling (beforeinstallprompt flow).
- `manifest.json` — PWA metadata.

Patterns & conventions to follow
- Language files: stored in `lang/<lang>.json`. Keys are nested and referenced by `data-i18n` attributes using dot-notation (e.g. `content.title`). Example: `lang/english.json` contains `content.title`, `content.graphTitle`, etc.
- Runtime interpolation: `js/languageLoader.js` uses `{variable}` placeholders (e.g. `"Welcome, {name}!"`) and replaces them from an in-memory `currentVariables` object. When modifying text, preserve this placeholder format.
- DOM inclusion: `w3.includeHTML()` is used to inline partial HTML files (for example `customers.html` via `w3-include-html` attribute). Changes to partials require re-running include or reloading.
- Global chart variable: the chart is declared in `index.html` as `let chart = new Chart(...)` and `js/languageLoader.js` updates its titles/labels via `updateChartText(chart)`. Keep that contract when refactoring.
- Service worker cache name: both `sw.js` and `index.html` use the cache key `vk_test_v1` (index has `const key = 'vk_test_v1'`). If you change cache logic, update both places.

Dev / debug workflows (quick)
- Serve over HTTP (service workers and fetch won't work on file://). Recommended quick servers (PowerShell):
  - Python 3: `python -m http.server 8000`
  - Node: `npx http-server . -p 8000`
  Open `http://localhost:8000` in browser.
- WebSocket testing: index expects a WS server at `ws://localhost:8080`. Start a test socket server or stub messages when validating UI flows.
- Service worker lifecycle: unregister or update from DevTools > Application > Service Workers, or call the page's `clearCache()` function which runs `caches.delete('vk_test_v1')` then reloads.

Common pitfalls discovered in code
- `js/languageLoader.js` uses a simple `resolveKey(obj, key)` implementation (reduces directly) which will throw if a nested key is missing — ensure language JSONs contain required keys or add guards when changing resolver logic.
- The service worker registration in `index.html` is commented out. To enable production PWA behavior, uncomment registration and verify cache lists in `sw.js`.

When editing UI text or adding new i18n keys
- Add the nested key to all language files under `lang/` (names match values in the `#language-select` <select>). Example: to change the graph title, update `content.graphTitle` in every `lang/*.json`.
- Keep placeholder style `{name}` for variable interpolation.

If you need to run tests or add a build step
- There is no build system present. Add a small npm script or a `package.json` if you intend to introduce bundling or test runners. For quick verification, use the static server commands above and open DevTools.

Quick examples (references)
- i18n key used in DOM: `<h1 data-i18n="content.title">TITTEL</h1>` — updated by `js/languageLoader.js`.
- Clear cache helper in page: `function clearCache()` in `index.html` calls `caches.delete(key)` then `location.reload()`.
- WebSocket: `ws = new WebSocket('ws://localhost:8080')` in `index.html` — change only if backend port/host changes.

If unsure, check these first: `index.html`, `js/languageLoader.js`, `sw.js`, `app.js`, `lang/*.json`.

If any of the above assumptions are incomplete or you want the file to include examples of automated checks (lint/test), tell me which toolchain you'd prefer and I'll extend this file with test/run commands.
