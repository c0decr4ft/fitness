# FORGE Fitness — Project Structure

The app is now split into separate files for easier maintenance and editing.

## File Layout

```
fitnes/
├── index.html          # HTML structure only (~710 lines)
├── css/
│   └── app.css         # All styles (~675 lines)
├── js/
│   ├── app.js          # All JavaScript logic (~3250 lines)
│   └── controls.js     # Touch/button handlers (if used)
├── server.py            # Python HTTP server + cloud sync
├── forge_cloud.json     # Local account data
└── STRUCTURE.md         # This file
```

## What Goes Where

| File | Contents |
|------|----------|
| **index.html** | Page structure, modals, forms. No inline CSS or JS. |
| **css/app.css** | Variables, layout, components, responsive rules. |
| **js/app.js** | Exercises, programs, i18n, auth, sync, community, coach, dashboard, log, etc. |

## Running the App

```bash
python server.py   # Serves on http://localhost:8765
```

Or open `index.html` directly in a browser (some features like user search need the server).
