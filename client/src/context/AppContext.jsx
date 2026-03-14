import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_ACCOUNTS = 'forge_accounts';
const STORAGE_CURRENT_USER = 'forge_current_user';

function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_ACCOUNTS)) || {};
  } catch {
    return {};
  }
}

function saveAccounts(accs) {
  localStorage.setItem(STORAGE_ACCOUNTS, JSON.stringify(accs));
}

async function hashPw(pw) {
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() =>
    localStorage.getItem(STORAGE_CURRENT_USER)
  );
  const [S, setS] = useState(() => {
    const saved = localStorage.getItem(STORAGE_CURRENT_USER);
    if (!saved) return {};
    const accs = getAccounts();
    return (accs[saved]?.data) || {};
  });
  const sRef = useRef(S);
  useEffect(() => {
    sRef.current = S;
  }, [S]);

  const save = useCallback(
    (state, opts = {}) => {
      if (!currentUser) return;
      const accs = getAccounts();
      if (!accs[currentUser]) return;
      const next = { ...state, _syncTs: Date.now() };
      accs[currentUser].data = next;
      saveAccounts(accs);
      setS(next);
      if (opts.immediateSync) {
        const acc = getAccounts()[currentUser];
        if (acc) {
          fetch('/api/account/' + encodeURIComponent(currentUser), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              u: currentUser,
              h: acc.hash,
              d: next,
              c: acc.created,
            }),
          }).catch(() => {});
        }
      }
    },
    [currentUser]
  );

  const login = useCallback(
    (username) => {
      const accs = getAccounts();
      const data = accs[username]?.data || {};
      setCurrentUser(username);
      setS(data);
      localStorage.setItem(STORAGE_CURRENT_USER, username);
    },
    []
  );

  const logout = useCallback(() => {
    if (currentUser && sRef.current && Object.keys(sRef.current).length) {
      const accs = getAccounts();
      if (accs[currentUser]) {
        accs[currentUser].data = { ...sRef.current, _syncTs: Date.now() };
        saveAccounts(accs);
      }
    }
    setCurrentUser(null);
    setS({});
    localStorage.removeItem(STORAGE_CURRENT_USER);
  }, [currentUser]);

  const signup = useCallback(async (username, password) => {
    const accs = getAccounts();
    if (accs[username]) throw new Error('Username already taken');
    const h = await hashPw(password);
    accs[username] = { hash: h, data: {}, created: Date.now() };
    saveAccounts(accs);
    login(username);
  }, [login]);

  const doLogin = useCallback(
    async (username, password) => {
      const u = username.trim().toLowerCase();
      const accs = getAccounts();
      if (accs[u]) {
        const h = await hashPw(password);
        if (accs[u].hash === h) {
          login(u);
          return;
        }
        throw new Error('Wrong password');
      }
      // Try cloud fetch
      try {
        const r = await fetch(`/api/account/${encodeURIComponent(u)}`);
        if (r.ok) {
          const cloudAcc = await r.json();
          if (cloudAcc.u === u) {
            const h = await hashPw(password);
            if (cloudAcc.h && cloudAcc.h !== h) throw new Error('Wrong password');
            const accs2 = getAccounts();
            accs2[u] = {
              hash: cloudAcc.h || h,
              data: cloudAcc.d || {},
              created: cloudAcc.c || Date.now(),
            };
            saveAccounts(accs2);
            login(u);
            return;
          }
        }
      } catch (e) {
        if (e.message === 'Wrong password') throw e;
      }
      throw new Error('Account not found');
    },
    [login]
  );

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_CURRENT_USER);
    if (saved && currentUser === saved) {
      const accs = getAccounts();
      const data = accs[saved]?.data || {};
      setS(data);
    }
  }, [currentUser]);

  const value = {
    currentUser,
    S,
    setS,
    save,
    login,
    logout,
    signup,
    doLogin,
    getAccounts,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
