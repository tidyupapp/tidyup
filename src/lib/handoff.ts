import type { Listing, Platform } from './types';
import { postToEbay } from './api';

export interface HandoffResult {
  platform: Platform;
  mode: 'auto' | 'handoff';
  url?: string;
  externalUrl?: string;
  copiedText?: string;
  photoDownloaded?: boolean;
  instructions: string[];
}

export async function handoffToPlatform(listing: Listing, platform: Platform): Promise<HandoffResult> {
  if (platform === 'ebay') {
    return postEbayAuto(listing);
  }
  return postHandoff(listing, platform as Exclude<Platform, 'ebay'>);
}

async function postEbayAuto(listing: Listing): Promise<HandoffResult> {
  const result = await postToEbay({
    title: listing.title,
    description: listing.description,
    priceUsd: listing.priceMax > 0 ? listing.priceMax : listing.priceMin,
    condition: listing.condition
  });
  return {
    platform: 'ebay',
    mode: 'auto',
    externalUrl: result.viewUrl,
    instructions: result.viewUrl
      ? [`Listed live on eBay.`, `View: ${result.viewUrl}`]
      : [`Listing draft created (offer ${result.offerId}). Visit eBay to complete details.`]
  };
}

async function postHandoff(listing: Listing, platform: Exclude<Platform, 'ebay'>): Promise<HandoffResult> {
  const clipboardBlock = formatClipboardBlock(listing, platform);
  await copyToClipboard(clipboardBlock);
  const photoDownloaded = await saveListingPhoto(listing);
  const handoff = HANDOFF_SPECS[platform];

  return {
    platform,
    mode: 'handoff',
    url: handoff.url,
    copiedText: clipboardBlock,
    photoDownloaded,
    instructions: handoff.instructions
  };
}

interface HandoffSpec {
  url: string;
  instructions: string[];
}

const HANDOFF_SPECS: Record<Exclude<Platform, 'ebay'>, HandoffSpec> = {
  facebook: {
    url: 'https://www.facebook.com/marketplace/create/item',
    instructions: [
      'Facebook Marketplace will open in a new tab.',
      'Tap "Add Photos" and pick the photo we just downloaded.',
      'Paste (Ctrl/Cmd+V) into Title — it grabs line one.',
      'Paste again into Description — it grabs the rest.',
      'Set price + category, then hit Publish.'
    ]
  },
  offerup: {
    url: 'https://offerup.com/sell',
    instructions: [
      'OfferUp will open in a new tab.',
      'Tap the camera icon and pick the photo we just downloaded.',
      'Paste the copied text into the description area.',
      'Set the price and category, then hit Post.'
    ]
  },
  nextdoor: {
    url: 'https://nextdoor.com/news_feed/?post=for_sale',
    instructions: [
      'Nextdoor will open in a new tab.',
      'Pick "For sale & free" if not already selected.',
      'Paste the copied text into the post body.',
      'Upload the photo we just downloaded.',
      'Set price + neighborhoods + post.'
    ]
  },
  craigslist: {
    url: 'https://post.craigslist.org/',
    instructions: [
      'Craigslist posting will open in a new tab.',
      'Pick your city, then "for sale by owner" and the right category.',
      'Paste the copied text — title is line one, body is the rest.',
      'Upload the photo we just downloaded.',
      'Finish in Craigslist (they require email verification).'
    ]
  }
};

export function openPlatformUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function formatClipboardBlock(listing: Listing, platform: Platform): string {
  const price = `$${listing.priceMin}${listing.priceMin !== listing.priceMax ? ` - $${listing.priceMax}` : ''}`;
  if (platform === 'facebook') {
    return [listing.title, '', listing.description, '', `Asking: ${price}`, `Condition: ${listing.condition}`].join('\n');
  }
  return [
    listing.title,
    '',
    listing.description,
    '',
    `Price: ${price}`,
    `Condition: ${listing.condition}`,
    `Category: ${listing.category}`
  ].join('\n');
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    /* fall through */
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(ta);
  }
}

async function saveListingPhoto(listing: Listing): Promise<boolean> {
  try {
    const blob = await (await fetch(listing.imageDataUrl)).blob();
    const filename = `${slugify(listing.title)}.jpg`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function platformLabel(p: Platform): string {
  switch (p) {
    case 'ebay':
      return 'eBay';
    case 'facebook':
      return 'Facebook Marketplace';
    case 'offerup':
      return 'OfferUp';
    case 'nextdoor':
      return 'Nextdoor';
    case 'craigslist':
      return 'Craigslist';
  }
}

export function platformMode(p: Platform): 'auto' | 'handoff' {
  return p === 'ebay' ? 'auto' : 'handoff';
}
