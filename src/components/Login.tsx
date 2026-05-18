import { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';

export function Login() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User dismissed the popup - silent.
      } else {
        setError((err as Error).message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <img src="/icon.svg" alt="" className="login-logo" />
        <h1 className="login-title">Tidyup</h1>
        <p className="login-tagline">Snap a photo. We sell it for you.</p>

        <ul className="login-bullets">
          <li><span aria-hidden>📷</span> Snap a photo of anything in your closet</li>
          <li><span aria-hidden>✨</span> AI writes the listing for you</li>
          <li><span aria-hidden>🤝</span> Post to Facebook &amp; Craigslist in seconds</li>
        </ul>

        <button className="google-button" onClick={handleSignIn} disabled={busy}>
          {busy ? (
            <span>Signing you in…</span>
          ) : (
            <>
              <GoogleIcon />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {error && <p className="login-error">{error}</p>}

        <p className="login-fineprint">
          Free to use. No credit card. We never post anything without your approval.
        </p>

        <p className="login-legal">
          By continuing you accept our <a href="/terms.html" target="_blank" rel="noopener">Terms</a> and <a href="/privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.
          <br />
          Tidyup is not affiliated with eBay, Facebook, OfferUp, Nextdoor, or Craigslist.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
