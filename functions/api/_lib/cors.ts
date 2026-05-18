import type { Env } from './env';

export function corsHeaders(req: Request, env: Env): HeadersInit {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

export function json(data: unknown, init: ResponseInit = {}, req?: Request, env?: Env): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (req && env) {
    const ch = corsHeaders(req, env);
    for (const [k, v] of Object.entries(ch)) headers.set(k, v as string);
  }
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function error(status: number, message: string, req?: Request, env?: Env): Response {
  return json({ error: message }, { status }, req, env);
}

export function handleCors(req: Request, env: Env): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req, env) });
  }
  return null;
}
