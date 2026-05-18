interface Props {
  open: boolean;
  onClose: () => void;
}

const FEATURES = [
  { icon: '🚫', title: 'Zero recommendations', body: 'Fully ad-free. No affiliate tips, no Pro-tier nudges.' },
  { icon: '∞', title: 'Unlimited listings', body: 'Free tier caps at 5 active listings. Pro removes the cap.' },
  { icon: '🧠', title: 'Smarter AI for items over $200', body: 'High-value items use Claude Opus for sharper, better-priced listings.' },
  { icon: '🔁', title: 'Auto-relist on Facebook', body: 'FB Marketplace expires listings every 7 days. Pro re-posts automatically.' },
  { icon: '💸', title: 'Bulk re-pricing', body: 'Drop prices across all your listings at once.' },
  { icon: '✉️', title: 'Full message history', body: 'Pro tier indexes and lets you search every buyer reply.' }
];

export function ProSheet({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet wide pro-sheet" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="sheet-header">
          <h2>Tidyup Pro</h2>
          <button className="text-button" onClick={onClose}>Close</button>
        </div>

        <div className="pro-hero">
          <div className="pro-price">
            <span className="pro-price-amount">$7.99</span>
            <span className="pro-price-period">/ month</span>
          </div>
          <div className="pro-price-sub">Cancel any time. No card on file = stays free.</div>
        </div>

        <ul className="pro-features">
          {FEATURES.map((f) => (
            <li key={f.title} className="pro-feature">
              <span className="pro-feature-icon" aria-hidden>{f.icon}</span>
              <div>
                <div className="pro-feature-title">{f.title}</div>
                <div className="pro-feature-body">{f.body}</div>
              </div>
            </li>
          ))}
        </ul>

        <button className="primary-button pro-cta" disabled>
          Coming soon · Join the waitlist
        </button>
        <p className="pro-fineprint">
          Pro is launching once we have core integrations stable. Tap above to be among the first to upgrade — we'll email you when it's ready.
        </p>
      </div>
    </div>
  );
}
