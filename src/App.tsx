import { useEffect, useState } from 'react';
import { Chat } from './components/Chat';
import { InstallPrompt } from './components/InstallPrompt';
import { Login } from './components/Login';
import { UserMenu } from './components/UserMenu';
import { ListingsSheet } from './components/ListingsSheet';
import { ConnectionsSheet } from './components/ConnectionsSheet';
import { ProSheet } from './components/ProSheet';
import { type AppUser, watchAuth } from './lib/firebase';
import { loadListings } from './lib/storage';
import { isStandalone } from './lib/platform';

type AuthState = { kind: 'loading' } | { kind: 'out' } | { kind: 'in'; user: AppUser };

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ kind: 'loading' });
  const [listingsOpen, setListingsOpen] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [proOpen, setProOpen] = useState(false);
  const [listingCount, setListingCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected')) {
      setConnectionsOpen(true);
      params.delete('connected');
    }
    const view = params.get('view');
    if (view === 'listings') {
      setListingsOpen(true);
      params.delete('view');
    } else if (view === 'connections') {
      setConnectionsOpen(true);
      params.delete('view');
    }
    if (isStandalone()) document.body.classList.add('is-standalone');
    const newSearch = params.toString();
    if (newSearch !== window.location.search.slice(1)) {
      window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''));
    }
  }, []);

  useEffect(() => {
    const unsub = watchAuth((user) => {
      setAuth(user ? { kind: 'in', user } : { kind: 'out' });
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (auth.kind !== 'in') return;
    setListingCount(loadListings().length);
    function refresh() {
      setListingCount(loadListings().length);
    }
    window.addEventListener('tidyup:listings-changed', refresh);
    return () => window.removeEventListener('tidyup:listings-changed', refresh);
  }, [auth.kind]);

  if (auth.kind === 'loading') {
    return (
      <div className="loading-screen">
        <img src="/icon.svg" alt="" className="loading-icon" />
      </div>
    );
  }

  if (auth.kind === 'out') {
    return <Login />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/icon.svg" alt="" className="brand-icon" />
          <span className="brand-name">Tidyup</span>
        </div>
        <UserMenu
          user={auth.user}
          listingCount={listingCount}
          onOpenListings={() => setListingsOpen(true)}
          onOpenConnections={() => setConnectionsOpen(true)}
          onOpenPro={() => setProOpen(true)}
        />
      </header>
      <main className="main">
        <Chat provider="gemini" />
      </main>
      <ListingsSheet open={listingsOpen} onClose={() => setListingsOpen(false)} />
      <ConnectionsSheet open={connectionsOpen} onClose={() => setConnectionsOpen(false)} />
      <ProSheet open={proOpen} onClose={() => setProOpen(false)} />
      <InstallPrompt />
    </div>
  );
}
