# FORGE Fitness — Project Structure

The app is a **React** frontend with a Python API server.

## File Layout

```
fitnes/
├── client/              # React app (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── app.css
│   │   ├── main.jsx
│   │   ├── context/AppContext.jsx
│   │   ├── components/AppLayout.jsx, ExerciseModal.jsx
│   │   ├── pages/AuthScreen, Dashboard, Exercises, etc.
│   │   └── data/exercises.js, programs.js, achievements.js, i18n.js
│   ├── package.json
│   └── vite.config.js
├── index.html           # Legacy (used when React not built)
├── css/app.css
├── js/app.js
├── server.py            # Python HTTP server + API + cloud sync
├── forge_cloud.json     # Local account data
└── STRUCTURE.md
```

## Running the App

**Development (React dev server + API proxy):**
```bash
# Terminal 1: API server
python server.py

# Terminal 2: React dev server
cd client && npm run dev
# Open http://localhost:5173
```

**Production (single server):**
```bash
cd client && npm run build
python server.py
# Open http://localhost:8765
```

## React Structure

| Path | Contents |
|------|----------|
| **App.jsx** | Routing, auth guard, protected routes |
| **context/AppContext** | Auth, user state (S), save, login, logout |
| **data/** | Exercises, programs, achievements, i18n |
| **pages/** | AuthScreen, Dashboard, Exercises, PlaceholderPage |
| **components/** | AppLayout (sidebar + nav), ExerciseModal |
