import type { Listing, Platform } from './types';

export type RecKind = 'shipping-label' | 'shipping-supplies' | 'trade-in';

export interface Recommendation {
  id: string;
  kind: RecKind;
  partner: string;
  headline: string;
  body: string;
  cta: string;
  url: string;
  badge: 'Tip' | 'Sponsored';
}

const PREFS_KEY = 'tidyup.recommendations.v1';
const DISMISSED_KEY = 'tidyup.recommendations.dismissed.v1';

export interface RecommendationPrefs {
  enabled: boolean;
}

export function getPrefs(): RecommendationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw) as RecommendationPrefs;
  } catch {
    /* ignore */
  }
  return { enabled: true };
}

export function setPrefs(prefs: RecommendationPrefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveDismissed(set: Set<string>): void {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(set)));
}

export function dismissRecommendation(listingId: string, recId: string): void {
  const set = loadDismissed();
  set.add(`${listingId}:${recId}`);
  saveDismissed(set);
}

function isDismissed(listingId: string, recId: string): boolean {
  return loadDismissed().has(`${listingId}:${recId}`);
}

// Decide which (if any) recommendation to show after the user posts a listing.
// Inputs: the listing + which platform they just posted to.
// Output: the single best-fit recommendation, or null if none apply.
export function pickRecommendation(listing: Listing, platform: Platform): Recommendation | null {
  if (!getPrefs().enabled) return null;

  const tradeIn = pickTradeInIfRelevant(listing);
  if (tradeIn && !isDismissed(listing.id, tradeIn.id)) return tradeIn;

  if (platform === 'ebay') {
    const label: Recommendation = {
      id: 'pirateship-label',
      kind: 'shipping-label',
      partner: 'Pirate Ship',
      headline: 'Need to ship this?',
      body: 'Pirate Ship gets USPS rates up to 89% cheaper than the post-office counter. Free to use, no monthly fees.',
      cta: 'Print a cheap label',
      url: 'https://ship.pirateship.com/signup',
      badge: 'Tip'
    };
    if (!isDismissed(listing.id, label.id)) return label;
  }

  // Local platforms: skip shipping suggestion.
  if (platform === 'facebook' || platform === 'offerup' || platform === 'nextdoor' || platform === 'craigslist') {
    return null;
  }

  return null;
}

function pickTradeInIfRelevant(listing: Listing): Recommendation | null {
  const text = `${listing.title} ${listing.description} ${listing.category}`.toLowerCase();

  if (/iphone|ipad|airpods|apple watch|macbook/.test(text)) {
    return {
      id: 'decluttr-apple',
      kind: 'trade-in',
      partner: 'Decluttr',
      headline: 'Faster cash for Apple gear',
      body: 'Decluttr usually beats peer-to-peer pricing on used Apple devices and pays within 24h of receiving it. Worth a quote before you list.',
      cta: 'Get an instant offer',
      url: 'https://www.decluttr.com/sell-my-tech',
      badge: 'Tip'
    };
  }

  if (/book|textbook|cookbook|hardcover|paperback/.test(text)) {
    return {
      id: 'bookscouter-books',
      kind: 'trade-in',
      partner: 'BookScouter',
      headline: 'Sell books faster?',
      body: 'BookScouter compares offers from 30+ buyback sites. Best for textbooks and nonfiction in good condition.',
      cta: 'Check book buyback offers',
      url: 'https://bookscouter.com',
      badge: 'Tip'
    };
  }

  if (/playstation|xbox|switch|nintendo|gaming/.test(text)) {
    return {
      id: 'decluttr-games',
      kind: 'trade-in',
      partner: 'Decluttr',
      headline: 'Trade in instead?',
      body: 'Decluttr buys consoles and games for instant cash. Often faster than waiting for the right buyer locally.',
      cta: 'Get an instant offer',
      url: 'https://www.decluttr.com',
      badge: 'Tip'
    };
  }

  return null;
}
