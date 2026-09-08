'use client';
import { useState } from 'react';
import Link from '@/components/astro/site-link';
import { accountName } from '@/lib/astro/catalog';
import { announceAccountChange } from './account-provider';
export default function LoginForm() {
  const [username, setUsername] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(logout = false) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/account', {
        method: logout ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(logout ? {} : { body: JSON.stringify({ username, password }) }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw Error(result.error || 'Sign-in failed.');
      announceAccountChange();
      window.location.assign(logout ? '/login' : '/catalog');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
      setBusy(false);
    }
  }
  const user = accountName();
  return (
    <div className="account-form">
      {user ? (
        <>
          <p>
            Signed in as <strong>{user}</strong>. Your catalog is saved to this
            account.
          </p>
          <Link href="/catalog" className="primary-button">
            Open my catalog
          </Link>
          <button
            className="secondary-button"
            disabled={busy}
            onClick={() => submit(true)}
          >
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <p>
            Sign in to keep your discoveries, observation plans, and notes together.
          </p>
          <label>
            Username
            <input
              autoComplete="username"
              required
              maxLength={50}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              maxLength={200}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="primary-button" disabled={busy}>
            {busy ? 'Signing in…' : 'Log in'}
          </button>
          <small>
            Your existing guest catalog stays separate and returns when you sign
            out.
          </small>
        </form>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
