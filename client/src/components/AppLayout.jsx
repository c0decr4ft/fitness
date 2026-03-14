import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Home', title: 'Dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { path: '/exercises', label: 'Exercises', title: 'Exercises', icon: 'M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z' },
  { path: '/timer', label: 'Timer', title: 'Timer', icon: 'M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A7.93 7.93 0 0012 4c-4.42 0-8 3.58-8 8s3.57 8 8 8 8-3.58 8-8c0-1.85-.63-3.55-1.67-4.91zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z' },
  { path: '/coach', label: 'Coach', title: 'AI Coach', icon: 'M21 10.5h-1V8c0-1.1-.9-2-2-2h-3V4.5C15 3.12 13.88 2 12.5 2h-1C10.12 2 9 3.12 9 4.5V6H6c-1.1 0-2 .9-2 2v2.5H3c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h1V20c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3.5h1c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1zM9.5 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM8 18l1.5-3h5L16 18H8z' },
];

const MORE_ITEMS = [
  { path: '/programs', label: 'Programs', icon: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z' },
  { path: '/progress', label: 'Progress', icon: 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z' },
  { path: '/community', label: 'Community', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
  { path: '/profile', label: 'Profile', icon: 'M12 12c2.7 0 4-1.3 4-4S14.7 4 12 4 8 5.3 8 8s1.3 4 4 4zm0 2c-2.7 0-8 1.4-8 4v2h16v-2c0-2.6-5.3-4-8-4z' },
  { path: '/settings', label: 'Settings', icon: 'M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z' },
];

function NavIcon({ d }) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20}>
      <path d={d} fill="currentColor" />
    </svg>
  );
}

export function AppLayout() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const isMoreActive = MORE_ITEMS.some((item) => location.pathname === item.path);

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="logo">FRG</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
            title={item.title}
          >
            <NavIcon d={item.icon} />
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto' }} />
        {MORE_ITEMS.slice(-2).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
            title={item.label}
          >
            <NavIcon d={item.icon} />
          </NavLink>
        ))}
      </nav>

      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
          >
            <NavIcon d={item.icon} />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
        <button
          className={`nav-btn ${isMoreActive || moreOpen ? 'active' : ''}`}
          onClick={() => setMoreOpen(!moreOpen)}
        >
          <svg viewBox="0 0 24 24" width={20} height={20}>
            <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor" />
          </svg>
          <span className="nav-label">More</span>
        </button>
      </nav>

      {moreOpen && (
        <>
          <div className="more-sheet open">
            <div className="more-sheet-handle" />
            <div className="more-sheet-grid">
              {MORE_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="more-sheet-item"
                  onClick={() => setMoreOpen(false)}
                >
                  <NavIcon d={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
          <div className="more-sheet-backdrop open" onClick={() => setMoreOpen(false)} />
        </>
      )}

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
