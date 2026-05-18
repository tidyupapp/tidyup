import type { Listing, Provider } from './types';

const LISTINGS_KEY = 'tidyup.listings.v1';
const PROVIDER_KEY = 'tidyup.provider.v1';

export function loadListings(): Listing[] {
  try {
    const raw = localStorage.getItem(LISTINGS_KEY);
    return raw ? (JSON.parse(raw) as Listing[]) : [];
  } catch {
    return [];
  }
}

export function saveListings(listings: Listing[]): void {
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
}

export function upsertListing(listing: Listing): Listing[] {
  const all = loadListings();
  const idx = all.findIndex((l) => l.id === listing.id);
  if (idx >= 0) all[idx] = listing;
  else all.unshift(listing);
  saveListings(all);
  return all;
}

export function getProvider(): Provider {
  const stored = localStorage.getItem(PROVIDER_KEY) as Provider | null;
  if (stored === 'claude' || stored === 'gemini') return stored;
  const fromEnv = (import.meta.env.VITE_AI_PROVIDER ?? 'claude') as Provider;
  return fromEnv;
}

export function setProvider(p: Provider): void {
  localStorage.setItem(PROVIDER_KEY, p);
}
