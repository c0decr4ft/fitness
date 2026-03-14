import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../data/i18n';

export function AuthScreen() {
  const { signup, doLogin, getAccounts } = useApp();
  const [tab, setTab] = useState('login');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [signupUser, setSignupUser] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupPass2, setSignupPass2] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setErr('');
    if (!loginUser.trim() || !loginPass) {
      setErr('Enter both username and password.');
      return;
    }
    setLoading(true);
    try {
      await doLogin(loginUser.trim(), loginPass);
    } catch (e) {
      setErr(e.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e?.preventDefault();
    setErr('');
    setOk('');
    const u = signupUser.trim().toLowerCase();
    if (!u || u.length < 2) {
      setErr('Username must be at least 2 characters.');
      return;
    }
    if (/[^a-z0-9_]/.test(u)) {
      setErr('Username: only lowercase letters, numbers, and underscores.');
      return;
    }
    if (signupPass.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }
    if (signupPass !== signupPass2) {
      setErr('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await signup(u, signupPass);
    } catch (e) {
      setErr(e.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const accs = getAccounts();
  const accountKeys = Object.keys(accs).filter((u) => !(JSON.parse(localStorage.getItem('forge_hidden_accounts') || '[]')).includes(u));

  return (
    <div id="auth-screen">
      <div className="auth-box">
        <div className="auth-logo">FORGE</div>
        <div className="auth-sub" dangerouslySetInnerHTML={{ __html: t('auth_sub') }} />
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setErr(''); setOk(''); }}
          >
            {t('auth_login')}
          </button>
          <button
            className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); setErr(''); setOk(''); }}
          >
            {t('auth_signup')}
          </button>
        </div>

        {tab === 'login' && (
          <div className="auth-form active">
            {err && <div className="auth-err">{err}</div>}
            <form onSubmit={handleLogin}>
              <label className="field-label">{t('auth_username')}</label>
              <input
                className="field-input"
                type="text"
                placeholder={t('ph_user')}
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                autoComplete="off"
              />
              <label className="field-label" style={{ marginTop: 12 }}>{t('auth_password')}</label>
              <div className="pw-input-wrap">
                <input
                  className="field-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder={t('ph_pass')}
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="pw-toggle-btn"
                  onClick={() => setShowPass(!showPass)}
                  title={showPass ? 'Hide password' : 'Show password'}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Logging in…' : t('auth_login')}
              </button>
            </form>
            <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
              {t('auth_cloud_note')}
            </p>
          </div>
        )}

        {tab === 'signup' && (
          <div className="auth-form active">
            {err && <div className="auth-err">{err}</div>}
            {ok && <div className="auth-ok">{ok}</div>}
            <form onSubmit={handleSignup}>
              <label className="field-label">{t('auth_choose_user')}</label>
              <input
                className="field-input"
                type="text"
                placeholder={t('ph_signup_user')}
                value={signupUser}
                onChange={(e) => setSignupUser(e.target.value)}
                autoComplete="off"
              />
              <label className="field-label" style={{ marginTop: 12 }}>{t('auth_create_pass')}</label>
              <div className="pw-input-wrap">
                <input
                  className="field-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder={t('ph_signup_pass')}
                  value={signupPass}
                  onChange={(e) => setSignupPass(e.target.value)}
                  autoComplete="off"
                />
                <button type="button" className="pw-toggle-btn" onClick={() => setShowPass(!showPass)}>
                  <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                </button>
              </div>
              <label className="field-label" style={{ marginTop: 12 }}>{t('auth_confirm_pass')}</label>
              <input
                className="field-input"
                type="password"
                placeholder={t('ph_signup_pass2')}
                value={signupPass2}
                onChange={(e) => setSignupPass2(e.target.value)}
                autoComplete="off"
              />
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Creating…' : t('auth_signup')}
              </button>
            </form>
          </div>
        )}

        {accountKeys.length > 0 && (
          <div className="auth-accounts">
            <div className="auth-divider">Accounts on this device</div>
            {accountKeys.map((u) => {
              const d = new Date(accs[u].created);
              const init = u.charAt(0).toUpperCase();
              const av = accs[u].data?.profile?.avatar;
              return (
                <div
                  key={u}
                  className="auth-account-item"
                  onClick={() => { setTab('login'); setLoginUser(u); setLoginPass(''); setErr(''); }}
                >
                  <div className="auth-account-avatar">
                    {av ? <img src={av} alt={init} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : init}
                  </div>
                  <div className="auth-account-info">
                    <div className="auth-account-name">{u}</div>
                    <div className="auth-account-date">Created {d.toLocaleDateString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
