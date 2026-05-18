import type { Env } from './env';

interface JWK {
  kid: string;
  n: string;
  e: string;
  alg: string;
  kty: string;
}

interface JWKSet {
  keys: JWK[];
}

interface JwtPayload {
  iss: string;
  aud: string;
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  exp: number;
  iat: number;
  auth_time?: number;
}

let jwksCache: { keys: JWK[]; expiresAt: number } | null = null;

async function fetchJwks(): Promise<JWK[]> {
  if (jwksCache && jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  // Use the JWK-formatted endpoint instead of the X509 cert endpoint.
  // This returns ready-to-import RSA keys, no ASN.1 parsing required.
  const res = await fetch(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
  );
  if (!res.ok) throw new Error('Failed to fetch Google JWKs');
  const body = (await res.json()) as { keys: JWK[] };
  const cacheControl = res.headers.get('Cache-Control') ?? '';
  const maxAge = parseInt(cacheControl.match(/max-age=(\d+)/)?.[1] ?? '3600', 10);
  jwksCache = { keys: body.keys, expiresAt: Date.now() + maxAge * 1000 };
  return body.keys;
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 2 ? '==' : s.length % 4 === 3 ? '=' : '';
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
}

export async function verifyFirebaseToken(token: string, env: Env): Promise<AuthenticatedUser> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');
  const [headerB64, payloadB64, sigB64] = parts;
  const header = JSON.parse(new TextDecoder().decode(b64urlDecode(headerB64)));
  const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64))) as JwtPayload;

  if (header.alg !== 'RS256') throw new Error('Unexpected algorithm');

  const expectedIss = `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`;
  if (payload.iss !== expectedIss) throw new Error('Invalid issuer');
  if (payload.aud !== env.FIREBASE_PROJECT_ID) throw new Error('Invalid audience');
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error('Token expired');
  if (payload.iat > now + 60) throw new Error('Token issued in the future');
  if (!payload.sub) throw new Error('No subject in token');

  const keys = await fetchJwks();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('Unknown signing key');

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signature = b64urlDecode(sigB64);
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, data);
  if (!ok) throw new Error('Signature verification failed');

  return {
    uid: payload.sub,
    email: payload.email ?? null,
    name: payload.name ?? null,
    photoURL: payload.picture ?? null
  };
}

export async function requireAuth(req: Request, env: Env): Promise<AuthenticatedUser> {
  const header = req.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    throw new HttpError(401, 'Missing bearer token');
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    return await verifyFirebaseToken(token, env);
  } catch (err) {
    throw new HttpError(401, `Invalid token: ${(err as Error).message}`);
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
