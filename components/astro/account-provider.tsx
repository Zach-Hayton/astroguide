'use client';
import { useEffect, useState } from 'react';
import Link from '@/components/astro/site-link';
import { accountName, initializeAccount } from '@/lib/astro/catalog';
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    initializeAccount()
      .then(() => {
        if (active) setReady(true);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    const changed = (e: StorageEvent) => {
      if (e.key === 'astroguide.account-change') window.location.reload();
    };
    window.addEventListener('storage', changed);
    return () => {
      active = false;
      window.removeEventListener('storage', changed);
    };
  }, []);
  if (!ready)
    return (
      <div className="account-loading" role="status">
        <h2>{error || 'Opening AstroGuide…'}</h2>
        {error && (
          <button
            className="secondary-button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        )}
      </div>
    );
  return children;
}
export function AccountLink() {
  return (
    <Link href="/login" className="login-link">
      {accountName() ?? 'Log in'}
    </Link>
  );
}
export function CatalogAccountBanner() {
  const user = accountName();
  return (
    <>
      <div>
        <strong>{user ? user + '’s catalog' : 'Your guest catalog'}</strong>
        <span>
          {user
            ? 'Saved to your account across browsers.'
            : 'Saved in this browser. Sign in for a separate synced catalog.'}
        </span>
      </div>
      <Link href="/login">{user ? 'Manage sign-in' : 'Log in'}</Link>
    </>
  );
}
export function announceAccountChange() {
  try {
    localStorage.setItem('astroguide.account-change', String(Date.now()));
  } catch {}
}
