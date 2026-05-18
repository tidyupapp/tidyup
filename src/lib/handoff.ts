import type { Listing, Platform } from './types';

export interface HandoffResult {
  platform: Platform;
  url: string;
  copiedText: string;
  photoDownloaded: boolean;
  instructions: string[];
}

export async function handoffToPlatform(listing: Listing, platform: Platform): Promise<HandoffResult> {
  const clipboardBlock = formatClipboardBlock(listing, platform);
  await copyToClipboard(clipboardBlock);

  const photoDownloaded = await saveListingPhoto(listing);

  if (platform === 'facebook') {
    return {
      platform,
      url: 'https://www.facebook.com/marketplace/create/item',
      copiedText: clipboardBlock,
      photoDownloaded,
      instructions: [
        'Facebook Marketplace will open in a new tab.',
        'Tap "Add Photos" and pick the photo you just downloaded.',
        'Paste (Cmd/Ctrl+V or long-press → Paste) into Title — Facebook grabs line one.',
        'Paste again into Description — it grabs the rest.',
        'Set the price and category, then hit Publish.'
      ]
    };
  }

  return {
    platform,
    url: 'https://post.craigslist.org/',
    copiedText: clipboardBlock,
    photoDownloaded,
    instructions: [
      'Craigslist posting will open in a new tab.',
      'Pick your city, then "for sale by owner" and the right category.',
      'Paste the copied text — title is line one, body is the rest.',
      'Upload the photo you just downloaded.',
      'Finish posting in Craigslist (they require email verification).'
    ]
  };
}

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
    /* fall through to legacy */
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
  return p === 'facebook' ? 'Facebook Marketplace' : 'Craigslist';
}
