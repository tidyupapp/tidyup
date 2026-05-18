import type { Env } from './_lib/env';
import { HttpError, requireAuth } from './_lib/auth';
import { handleCors, json, error } from './_lib/cors';
import { upsertUser, listConnections, deleteConnection } from './_lib/db';
import { analyzeImage, chatReply, type Provider, type ChatTurn } from './_lib/ai';
import { ebayAuthorizeUrl, completeOAuth, publishToEbay } from './_lib/connections/ebay';

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
// In-memory store; Pages Functions are short-lived but OAuth state TTL is short.
// For production-grade durability, swap to KV.
const oauthState = new Map<string, { uid: string; expires: number }>();

function makeState(uid: string): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  const state = Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
  oauthState.set(state, { uid, expires: Date.now() + OAUTH_STATE_TTL_MS });
  for (const [k, v] of oauthState) if (v.expires < Date.now()) oauthState.delete(k);
  return state;
}

function consumeState(state: string): string | null {
  const entry = oauthState.get(state);
  if (!entry || entry.expires < Date.now()) return null;
  oauthState.delete(state);
  return entry.uid;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const corsResponse = handleCors(request, env);
  if (corsResponse) return corsResponse;

  const url = new URL(request.url);

  try {
    return await route(request, env, url);
  } catch (err) {
    if (err instanceof HttpError) return error(err.status, err.message, request, env);
    console.error(err);
    return error(500, `Server error: ${(err as Error).message}`, request, env);
  }
};

async function route(req: Request, env: Env, url: URL): Promise<Response> {
  const path = url.pathname;

  if (path === '/api' || path === '/api/' || path === '/api/health') {
    return json({ ok: true, service: 'tidyup-api' }, {}, req, env);
  }

  // eBay OAuth callback — public (eBay redirects here). Auth via state token.
  if (path === '/api/connections/ebay/callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code || !state) throw new HttpError(400, 'Missing code or state');
    const uid = consumeState(state);
    if (!uid) throw new HttpError(400, 'Invalid or expired state');
    await completeOAuth(env, { uid, email: null, name: null, photoURL: null }, code);
    const redirectTo = `${env.APP_BASE_URL}/?connected=ebay`;
    return Response.redirect(redirectTo, 302);
  }

  // All other /api/* require Firebase auth.
  if (!path.startsWith('/api/')) {
    return error(404, 'Not found', req, env);
  }

  const user = await requireAuth(req, env);
  await upsertUser(env, user);

  if (path === '/api/me' && req.method === 'GET') {
    return json({ user }, {}, req, env);
  }

  if (path === '/api/ai/analyze' && req.method === 'POST') {
    const body = (await req.json()) as { imageDataUrl?: string; provider?: Provider };
    if (!body.imageDataUrl) throw new HttpError(400, 'Missing imageDataUrl');
    const provider: Provider = body.provider === 'claude' ? 'claude' : 'gemini';
    const draft = await analyzeImage(env, provider, body.imageDataUrl);
    return json({ draft }, {}, req, env);
  }

  if (path === '/api/ai/chat' && req.method === 'POST') {
    const body = (await req.json()) as { history?: ChatTurn[]; provider?: Provider };
    if (!Array.isArray(body.history)) throw new HttpError(400, 'Missing history');
    const provider: Provider = body.provider === 'claude' ? 'claude' : 'gemini';
    const reply = await chatReply(env, provider, body.history);
    return json({ reply }, {}, req, env);
  }

  if (path === '/api/connections' && req.method === 'GET') {
    const rows = await listConnections(env, user.uid);
    return json({ connections: rows }, {}, req, env);
  }

  if (path === '/api/connections/ebay/start' && req.method === 'POST') {
    const state = makeState(user.uid);
    const authorizeUrl = ebayAuthorizeUrl(env, state);
    return json({ url: authorizeUrl }, {}, req, env);
  }

  const disconnectMatch = path.match(/^\/api\/connections\/([a-z]+)$/);
  if (disconnectMatch && req.method === 'DELETE') {
    await deleteConnection(env, user.uid, disconnectMatch[1]);
    return json({ ok: true }, {}, req, env);
  }

  if (path === '/api/listings/post/ebay' && req.method === 'POST') {
    const body = (await req.json()) as {
      title: string;
      description: string;
      priceUsd: number;
      condition: string;
      imageUrl?: string;
    };
    const result = await publishToEbay(env, user.uid, body);
    return json({ result }, {}, req, env);
  }

  return error(404, 'Not found', req, env);
}
