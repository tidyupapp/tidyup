import { useEffect, useState } from 'react';
import { disconnect, getConnections, startEbayConnect, type ConnectionRow } from '../lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tier = 'auto' | 'handoff' | 'soon';

interface PlatformSpec {
  id: string;
  label: string;
  tier: Tier;
  blurb: string;
  brandColor: string;
}

const PLATFORMS: PlatformSpec[] = [
  {
    id: 'ebay',
    label: 'eBay',
    tier: 'auto',
    blurb: 'Real API. Connect once, your listings post automatically.',
    brandColor: '#E53238'
  },
  {
    id: 'facebook',
    label: 'Facebook Marketplace',
    tier: 'handoff',
    blurb: 'No public API — we copy your listing to clipboard and open Facebook in a new tab.',
    brandColor: '#1877F2'
  },
  {
    id: 'offerup',
    label: 'OfferUp',
    tier: 'handoff',
    blurb: 'No public API — clipboard handoff opens the OfferUp post page.',
    brandColor: '#2BB14B'
  },
  {
    id: 'nextdoor',
    label: 'Nextdoor',
    tier: 'handoff',
    blurb: 'No public API — handoff opens Nextdoor "For sale" post.',
    brandColor: '#00BD7E'
  },
  {
    id: 'craigslist',
    label: 'Craigslist',
    tier: 'handoff',
    blurb: 'Handoff opens post.craigslist.org with your listing in clipboard.',
    brandColor: '#551A8B'
  },
  {
    id: 'etsy',
    label: 'Etsy',
    tier: 'soon',
    blurb: 'Real API — coming soon. Handmade & vintage focus.',
    brandColor: '#F45800'
  },
  {
    id: 'mercari',
    label: 'Mercari',
    tier: 'soon',
    blurb: 'Real API — application required for access. We are looking into it.',
    brandColor: '#5A31F4'
  },
  {
    id: 'poshmark',
    label: 'Poshmark',
    tier: 'soon',
    blurb: 'No public API. Handoff support coming.',
    brandColor: '#7B257C'
  }
];

export function ConnectionsSheet({ open, onClose }: Props) {
  const [connections, setConnections] = useState<ConnectionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    getConnections()
      .then(setConnections)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [open]);

  async function handleConnect(platform: string) {
    if (platform !== 'ebay') return;
    setConnecting(platform);
    try {
      const url = await startEbayConnect();
      window.location.href = url;
    } catch (e) {
      setError((e as Error).message);
      setConnecting(null);
    }
  }

  async function handleDisconnect(platform: string) {
    try {
      await disconnect(platform);
      setConnections((c) => c.filter((x) => x.platform !== platform));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!open) return null;

  const connectedMap = new Map(connections.map((c) => [c.platform, c]));

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet wide" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="sheet-header">
          <h2>Connections</h2>
          <button className="text-button" onClick={onClose}>Close</button>
        </div>

        <p className="sheet-intro">
          Connect Tidyup to the marketplaces you use. Connected accounts post automatically.
          For platforms without an API, we hand off your listing in seconds.
        </p>

        {error && <div className="sheet-error">⚠️ {error}</div>}
        {loading && <div className="sheet-loading">Loading…</div>}

        <ul className="connection-list">
          {PLATFORMS.map((p) => {
            const conn = connectedMap.get(p.id);
            const connected = !!conn;
            return (
              <li key={p.id} className={`connection-card tier-${p.tier}`}>
                <div className="connection-mark" style={{ background: p.brandColor }}>
                  {p.label.charAt(0)}
                </div>
                <div className="connection-body">
                  <div className="connection-head">
                    <span className="connection-label">{p.label}</span>
                    <TierBadge tier={p.tier} connected={connected} />
                  </div>
                  <p className="connection-blurb">
                    {connected && conn?.account_label
                      ? `Connected as ${conn.account_label}`
                      : p.blurb}
                  </p>
                </div>
                <div className="connection-action">
                  {p.tier === 'auto' &&
                    (connected ? (
                      <button className="text-button danger" onClick={() => handleDisconnect(p.id)}>
                        Disconnect
                      </button>
                    ) : (
                      <button
                        className="primary-button small"
                        onClick={() => handleConnect(p.id)}
                        disabled={connecting === p.id}
                      >
                        {connecting === p.id ? 'Opening…' : 'Connect'}
                      </button>
                    ))}
                  {p.tier === 'handoff' && <span className="action-hint">Always on</span>}
                  {p.tier === 'soon' && <span className="action-hint">Coming soon</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function TierBadge({ tier, connected }: { tier: Tier; connected: boolean }) {
  if (connected) return <span className="tier-badge connected">✓ Connected</span>;
  if (tier === 'auto') return <span className="tier-badge auto">Auto-post</span>;
  if (tier === 'handoff') return <span className="tier-badge handoff">Handoff</span>;
  return <span className="tier-badge soon">Soon</span>;
}
