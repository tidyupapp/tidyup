import { useState } from 'react';
import type { Listing, Platform } from '../lib/types';
import { platformLabel } from '../lib/handoff';

interface Props {
  listing: Listing;
  onChange: (next: Listing) => void;
  onPostTo: (platform: Platform) => void;
}

const PLATFORMS: { id: Platform; label: string; hint: string }[] = [
  { id: 'facebook', label: 'Facebook', hint: 'Marketplace' },
  { id: 'craigslist', label: 'Craigslist', hint: 'For sale' }
];

export function ListingCard({ listing, onChange, onPostTo }: Props) {
  const [editing, setEditing] = useState(false);

  function togglePlatform(p: Platform) {
    const has = listing.selectedPlatforms.includes(p);
    onChange({
      ...listing,
      selectedPlatforms: has
        ? listing.selectedPlatforms.filter((x) => x !== p)
        : [...listing.selectedPlatforms, p]
    });
  }

  return (
    <div className="listing-card">
      <img src={listing.imageDataUrl} alt="" className="listing-photo" />
      <div className="listing-body">
        {editing ? (
          <input
            className="listing-title-input"
            value={listing.title}
            onChange={(e) => onChange({ ...listing, title: e.target.value })}
            maxLength={80}
          />
        ) : (
          <h3 className="listing-title">{listing.title}</h3>
        )}

        <div className="listing-price">
          <span className="price-symbol">$</span>
          <input
            type="number"
            className="price-input"
            value={listing.priceMin}
            onChange={(e) => onChange({ ...listing, priceMin: Number(e.target.value) })}
          />
          <span className="price-dash">–</span>
          <span className="price-symbol">$</span>
          <input
            type="number"
            className="price-input"
            value={listing.priceMax}
            onChange={(e) => onChange({ ...listing, priceMax: Number(e.target.value) })}
          />
        </div>

        {editing ? (
          <textarea
            className="listing-desc-input"
            value={listing.description}
            onChange={(e) => onChange({ ...listing, description: e.target.value })}
            rows={5}
          />
        ) : (
          <p className="listing-desc">{listing.description}</p>
        )}

        <div className="meta-row">
          <span className="chip">{listing.category}</span>
          <span className="chip">{listing.condition}</span>
        </div>

        <div className="platform-grid">
          {PLATFORMS.map((p) => {
            const on = listing.selectedPlatforms.includes(p.id);
            const posted = listing.postedTo.includes(p.id);
            return (
              <button
                key={p.id}
                className={`platform-pill ${on ? 'on' : ''} ${posted ? 'posted' : ''}`}
                onClick={() => togglePlatform(p.id)}
              >
                {posted ? '✓ ' : ''}{p.label}
                <span className="hint"> · {p.hint}</span>
              </button>
            );
          })}
        </div>

        <div className="post-buttons">
          {listing.selectedPlatforms.map((p) => (
            <button
              key={p}
              className="primary-button small"
              onClick={() => onPostTo(p)}
              disabled={listing.postedTo.includes(p)}
            >
              {listing.postedTo.includes(p) ? `✓ Sent to ${platformLabel(p)}` : `Post to ${platformLabel(p)}`}
            </button>
          ))}
        </div>

        <div className="actions-row">
          <button className="text-button" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Done editing' : 'Edit text'}
          </button>
        </div>
      </div>
    </div>
  );
}
