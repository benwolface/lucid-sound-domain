import { useEffect, useMemo, useState } from "react";
import { apiGetMe, apiSignIn, apiSignOut, apiTrackEvent } from "./lib/api";

function SignInCard({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && name.trim().length > 0 && !busy;
  }, [email, name, busy]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { user } = await apiSignIn({
        email: email.trim(),
        name: name.trim()
      });
      onSignedIn(user);
    } catch (err) {
      setError(err?.message || "sign_in_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>Sign in</h2>
      <p className="muted">Just email + name. No passwords for the MVP.</p>

      <form onSubmit={onSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="field">
          <span>Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            autoComplete="name"
            placeholder="Your name"
            required
          />
        </label>

        {error ? <div className="error">{error}</div> : null}

        <button className="primary" type="submit" disabled={!canSubmit}>
          {busy ? "Signing in..." : "Continue"}
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let mounted = true;

    apiGetMe()
      .then((res) => {
        if (mounted) setUser(res?.user || null);
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setBooting(false);
      });

    // Track page view early (backend ensures a visitor row exists).
    apiTrackEvent({
      type: "page_view",
      properties: { path: window.location.pathname }
    }).catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  async function onSignedIn(newUser) {
    setUser(newUser);
    // Optionally track from the client too; server also records sign-in.
    apiTrackEvent({
      type: "page_view",
      properties: { path: window.location.pathname, after: "signin" }
    }).catch(() => {});
  }

  async function onSignOut() {
    setUser(null);
    try {
      await apiSignOut();
    } catch {
      // ignore
    } finally {
      apiTrackEvent({
        type: "page_view",
        properties: { path: window.location.pathname, after: "signout" }
      }).catch(() => {});
    }
  }

  return (
    <div className="page">
      <header className="header">
        <div className="brand">
          <div className="logo" aria-hidden="true" />
          <div>
            <div className="brand-title">Lucid Sound Domain</div>
            <div className="brand-subtitle">Landing + sign-in + tracking (MVP)</div>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <h1>Make a calm, intentional landing page.</h1>
          <p className="muted">
            Visitors get tracked; sign-ins create a remembered user identity. Email + name only for
            now.
          </p>
        </section>

        {booting ? <div className="card">Loading...</div> : null}

        {!booting && user ? (
          <div className="card">
            <h2>Welcome, {user.name}</h2>
            <p className="muted">You are signed in as {user.email}.</p>
            <button className="primary" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        ) : null}

        {!booting && !user ? <SignInCard onSignedIn={onSignedIn} /> : null}

        <section className="footer-note">
          <span className="pill">PWA</span>
          <span className="pill">Tracked sessions</span>
          <span className="pill">Remembered sign-ins</span>
        </section>
      </main>
    </div>
  );
}

