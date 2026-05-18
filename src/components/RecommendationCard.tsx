import { useState } from 'react';
import type { Recommendation } from '../lib/recommendations';
import { dismissRecommendation } from '../lib/recommendations';

interface Props {
  listingId: string;
  rec: Recommendation;
}

export function RecommendationCard({ listingId, rec }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function handleDismiss() {
    dismissRecommendation(listingId, rec.id);
    setDismissed(true);
  }

  return (
    <div className={`rec-card kind-${rec.kind}`}>
      <div className="rec-card-head">
        <span className="rec-badge">{rec.badge}</span>
        <button className="rec-dismiss" onClick={handleDismiss} aria-label="Hide this suggestion">
          ×
        </button>
      </div>
      <div className="rec-body">
        <h4 className="rec-headline">{rec.headline}</h4>
        <p className="rec-text">{rec.body}</p>
        <a
          href={rec.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="rec-cta"
        >
          {rec.cta} →
        </a>
        <div className="rec-disclosure">via {rec.partner} · Tidyup may earn a small commission</div>
      </div>
    </div>
  );
}
