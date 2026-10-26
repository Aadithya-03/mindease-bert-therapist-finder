import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { friendlyAuthError, useAuth } from '../context/AuthContext';
import { firebaseConfigured } from '../firebase';

export default function Login() {
  const { user, signIn, signUp, google } = useAuth();
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const run = async (fn) => {
    setError(''); setBusy(true);
    try { await fn(); } catch (e) { setError(friendlyAuthError(e)); } finally { setBusy(false); }
  };
  const submit = (e) => {
    e.preventDefault();
    run(() => (mode === 'signin' ? signIn(form.email, form.password) : signUp(form.email, form.password, form.name.trim())));
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="login-wrap">
      <div className="card login">
        <div className="brand"><span className="brand-icon"><Brain size={22} aria-hidden /></span>MindEase</div>
        <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="muted">A private space to talk about how you feel. Your conversations are tied to your account only.</p>

        {!firebaseConfigured && <div className="banner banner-error">Firebase keys are missing. Copy client/.env.example to client/.env and fill it in, then restart.</div>}

        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>Sign in</button>
          <button role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Create account</button>
        </div>

        <form onSubmit={submit} className="stack">
          {mode === 'signup' && (
            <label>Name<input value={form.name} onChange={set('name')} autoComplete="name" required maxLength={60} /></label>
          )}
          <label>Email<input type="email" value={form.email} onChange={set('email')} autoComplete="email" required /></label>
          <label>Password<input type="password" value={form.password} onChange={set('password')} required minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} /></label>
          {error && <div className="banner banner-error" role="alert">{error}</div>}
          <button className="btn btn-primary" disabled={busy}>{mode === 'signin' ? 'Sign in' : 'Create account'}</button>
        </form>

        <div className="divider"><span>or</span></div>
        <button className="btn" onClick={() => run(google)} disabled={busy}>Continue with Google</button>
      </div>
    </div>
  );
}
