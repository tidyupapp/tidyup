import { useEffect, useState } from 'react';
import type { Listing } from '../lib/types';
import { loadListings } from '../lib/storage';
import { platformLabel } from '../lib/handoff';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ListingsSheet({ open, onClose }: Props) {
  const [items, setItems] = useState<Listing[]>([]);

  useEffect(() => {
    if (open) setItems(loadListings());
  }, [open]);

  if (!open) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="sheet-header">
          <h2>My listings</h2>
          <button className="text-button" onClick={onClose}>Close</button>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <p>No listings yet.</p>
            <p className="empty-hint">Snap a photo of something to sell and it'll show up here.</p>
          </div>
        ) : (
          <ul className="listing-list">
            {items.map((l) => (
              <li key={l.id} className="listing-row">
                <img src={l.imageDataUrl} alt="" />
                <div className="listing-row-body">
                  <div className="listing-row-title">{l.title}</div>
                  <div className="listing-row-meta">
                    ${l.priceMin}{l.priceMin !== l.priceMax ? `–$${l.priceMax}` : ''}
                    {' · '}
                    {l.postedTo.length > 0
                      ? `Posted to ${l.postedTo.map(platformLabel).join(', ')}`
                      : 'Draft'}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
