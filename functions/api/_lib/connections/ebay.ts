import type { Env } from '../env';
import { HttpError, type AuthenticatedUser } from '../auth';
import { saveConnection, getConnection } from '../db';

const SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
  'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly'
].join(' ');

function endpoints(env: Env) {
  const sandbox = env.EBAY_ENVIRONMENT !== 'production';
  return {
    auth: sandbox ? 'https://auth.sandbox.ebay.com/oauth2/authorize' : 'https://auth.ebay.com/oauth2/authorize',
    token: sandbox ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token' : 'https://api.ebay.com/identity/v1/oauth2/token',
    api: sandbox ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com'
  };
}

function requireCreds(env: Env): { clientId: string; clientSecret: string; runame: string } {
  if (!env.EBAY_CLIENT_ID || !env.EBAY_CLIENT_SECRET || !env.EBAY_RUNAME) {
    throw new HttpError(503, 'eBay not configured. Set EBAY_CLIENT_ID, EBAY_CLIENT_SECRET (secrets) and EBAY_RUNAME (var).');
  }
  return { clientId: env.EBAY_CLIENT_ID, clientSecret: env.EBAY_CLIENT_SECRET, runame: env.EBAY_RUNAME };
}

export function ebayAuthorizeUrl(env: Env, state: string): string {
  const { clientId, runame } = requireCreds(env);
  const url = new URL(endpoints(env).auth);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', runame);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'login');
  return url.toString();
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  refresh_token_expires_in?: number;
  token_type: string;
}

export async function exchangeCode(env: Env, code: string): Promise<TokenResponse> {
  const { clientId, clientSecret, runame } = requireCreds(env);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: runame
  });
  const res = await fetch(endpoints(env).token, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`
    },
    body
  });
  if (!res.ok) throw new HttpError(502, `eBay token exchange failed: ${await res.text()}`);
  return (await res.json()) as TokenResponse;
}

export async function refreshAccessToken(env: Env, refreshToken: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = requireCreds(env);
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: SCOPES
  });
  const res = await fetch(endpoints(env).token, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`
    },
    body
  });
  if (!res.ok) throw new HttpError(502, `eBay refresh failed: ${await res.text()}`);
  return (await res.json()) as TokenResponse;
}

async function fetchEbayIdentity(env: Env, accessToken: string): Promise<{ userId: string; username: string }> {
  const res = await fetch(`${endpoints(env).api}/commerce/identity/v1/user/`, {
    headers: { authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) return { userId: 'unknown', username: 'eBay user' };
  const body = (await res.json()) as { userId?: string; username?: string };
  return { userId: body.userId ?? 'unknown', username: body.username ?? 'eBay user' };
}

export async function completeOAuth(env: Env, user: AuthenticatedUser, code: string): Promise<void> {
  const tokens = await exchangeCode(env, code);
  const identity = await fetchEbayIdentity(env, tokens.access_token);
  await saveConnection(env, user.uid, {
    platform: 'ebay',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at: Date.now() + tokens.expires_in * 1000,
    account_id: identity.userId,
    account_label: identity.username
  });
}

export async function ensureAccessToken(env: Env, uid: string): Promise<string> {
  const conn = await getConnection(env, uid, 'ebay');
  if (!conn) throw new HttpError(400, 'eBay not connected');
  if (conn.expires_at && conn.expires_at > Date.now() + 60_000) {
    return conn.access_token;
  }
  if (!conn.refresh_token) {
    throw new HttpError(401, 'eBay token expired and no refresh token available — reconnect');
  }
  const refreshed = await refreshAccessToken(env, conn.refresh_token);
  await saveConnection(env, uid, {
    platform: 'ebay',
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token ?? conn.refresh_token,
    expires_at: Date.now() + refreshed.expires_in * 1000,
    account_id: conn.account_id,
    account_label: conn.account_label
  });
  return refreshed.access_token;
}

export interface EbayListingInput {
  title: string;
  description: string;
  priceUsd: number;
  condition: string;
  sku?: string;
  imageUrl?: string;
}

const CONDITION_MAP: Record<string, string> = {
  new: 'NEW',
  'like-new': 'LIKE_NEW',
  good: 'USED_EXCELLENT',
  fair: 'USED_GOOD',
  'for-parts': 'FOR_PARTS_OR_NOT_WORKING'
};

export async function publishToEbay(
  env: Env,
  uid: string,
  input: EbayListingInput
): Promise<{ offerId: string; listingId?: string; viewUrl?: string }> {
  const token = await ensureAccessToken(env, uid);
  const sku = input.sku ?? `tidyup-${Date.now()}`;
  const apiBase = endpoints(env).api;
  const headers = {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    'content-language': 'en-US'
  };

  // 1. Create inventory item.
  const inventoryRes = await fetch(`${apiBase}/sell/inventory/v1/inventory_item/${sku}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      product: {
        title: input.title,
        description: input.description,
        imageUrls: input.imageUrl ? [input.imageUrl] : []
      },
      condition: CONDITION_MAP[input.condition] ?? 'USED_GOOD',
      availability: { shipToLocationAvailability: { quantity: 1 } }
    })
  });
  if (!inventoryRes.ok && inventoryRes.status !== 204) {
    throw new HttpError(502, `eBay inventory item failed: ${await inventoryRes.text()}`);
  }

  // 2. Create offer.
  const offerRes = await fetch(`${apiBase}/sell/inventory/v1/offer`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sku,
      marketplaceId: 'EBAY_US',
      format: 'FIXED_PRICE',
      pricingSummary: { price: { value: input.priceUsd.toFixed(2), currency: 'USD' } },
      listingDescription: input.description,
      categoryId: '99' // generic fallback; user can move later
    })
  });
  if (!offerRes.ok) throw new HttpError(502, `eBay create offer failed: ${await offerRes.text()}`);
  const offer = (await offerRes.json()) as { offerId: string };

  // 3. Publish offer.
  const publishRes = await fetch(`${apiBase}/sell/inventory/v1/offer/${offer.offerId}/publish`, {
    method: 'POST',
    headers
  });
  if (!publishRes.ok) {
    return { offerId: offer.offerId };
  }
  const pub = (await publishRes.json()) as { listingId?: string };
  const viewUrl = pub.listingId
    ? env.EBAY_ENVIRONMENT === 'production'
      ? `https://www.ebay.com/itm/${pub.listingId}`
      : `https://www.sandbox.ebay.com/itm/${pub.listingId}`
    : undefined;
  return { offerId: offer.offerId, listingId: pub.listingId, viewUrl };
}
