import { useEffect, useState } from 'react';
import { Chat } from './components/Chat';
import { InstallPrompt } from './components/InstallPrompt';
import { Login } from './components/Login';
import { UserMenu } from './components/UserMenu';
import { ListingsSheet } from './components/ListingsSheet';
import { ConnectionsSheet } from './components/ConnectionsSheet';
import { type AppUser, watchAuth } from './lib/firebase';
import { loadListings } from './lib/storage';

type AuthState = { kind: 'loading' } | { kind: 'out' } | { kind: 'in'; user: AppUser };

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ kind: 'loading' });
  const [listingsOpen, setListingsOpen] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [listingCount, setListingCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected')) {
      setConnectionsOpen(true);
      params.delete('connected');
      const newSearch = params.toString();
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
        />
      </header>
      <main className="main">
        <Chat provider="gemini" />
      </main>
      <ListingsSheet open={listingsOpen} onClose={() => setListingsOpen(false)} />
      <ConnectionsSheet open={connectionsOpen} onClose={() => setConnectionsOpen(false)} />
      <InstallPrompt />
    </div>
  );
}
