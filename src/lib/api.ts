import { getAuth } from 'firebase/auth';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  // API_BASE empty = same-origin /api/* calls (Pages Functions).
  // Non-empty = cross-origin call to a standalone Worker (legacy).
  const user = getAuth().currentUser;
  if (!user) throw new ApiError(401, 'Not signed in');
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const body = await res.json();
      msg = (body as { error?: string }).error ?? msg;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg);
  }
  return res;
}

export interface AiListingDraft {
  identifiedItem: string;
  title: string;
  description: string;
  priceMin: number;
  priceMax: number;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'for-parts';
  suggestedPlatforms: string[];
  notes?: string;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export async function aiAnalyze(imageDataUrl: string, provider: 'gemini' | 'claude' = 'gemini'): Promise<AiListingDraft> {
  const res = await authedFetch('/api/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ imageDataUrl, provider })
  });
  const body = (await res.json()) as { draft: AiListingDraft };
  return body.draft;
}

export async function aiChat(history: ChatTurn[], provider: 'gemini' | 'claude' = 'gemini'): Promise<string> {
  const res = await authedFetch('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ history, provider })
  });
  const body = (await res.json()) as { reply: string };
  return body.reply;
}

export interface ConnectionRow {
  platform: string;
  account_id: string | null;
  account_label: string | null;
  status: string;
  expires_at: number | null;
  created_at: number;
  updated_at: number;
}

export async function getConnections(): Promise<ConnectionRow[]> {
  const res = await authedFetch('/api/connections');
  const body = (await res.json()) as { connections: ConnectionRow[] };
  return body.connections;
}

export async function startEbayConnect(): Promise<string> {
  const res = await authedFetch('/api/connections/ebay/start', { method: 'POST' });
  const body = (await res.json()) as { url: string };
  return body.url;
}

export async function disconnect(platform: string): Promise<void> {
  await authedFetch(`/api/connections/${platform}`, { method: 'DELETE' });
}

export interface EbayPostInput {
  title: string;
  description: string;
  priceUsd: number;
  condition: string;
  imageUrl?: string;
}

export interface EbayPostResult {
  offerId: string;
  listingId?: string;
  viewUrl?: string;
}

export async function postToEbay(input: EbayPostInput): Promise<EbayPostResult> {
  const res = await authedFetch('/api/listings/post/ebay', {
    method: 'POST',
    body: JSON.stringify(input)
  });
  const body = (await res.json()) as { result: EbayPostResult };
  return body.result;
}
