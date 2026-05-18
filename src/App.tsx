import { useEffect, useState } from 'react';
import type { Provider } from './lib/types';
import { getProvider, setProvider as persistProvider } from './lib/storage';
import { Chat } from './components/Chat';
import { InstallPrompt } from './components/InstallPrompt';

export default function App() {
  const [provider, setProviderState] = useState<Provider>(getProvider());

  useEffect(() => {
    persistProvider(provider);
  }, [provider]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/icon.svg" alt="" className="brand-icon" />
          <span className="brand-name">Tidyup</span>
        </div>
        <label className="provider-toggle">
          <span className="sr-only">AI provider</span>
          <select
            value={provider}
            onChange={(e) => setProviderState(e.target.value as Provider)}
          >
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
          </select>
        </label>
      </header>
      <main className="main">
        <Chat provider={provider} />
      </main>
      <InstallPrompt />
    </div>
  );
}
