import type { Env } from './env';
import type { AuthenticatedUser } from './auth';

export async function upsertUser(env: Env, user: AuthenticatedUser): Promise<void> {
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO users (firebase_uid, email, name, photo_url, created_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(firebase_uid) DO UPDATE SET
       email = excluded.email,
       name = excluded.name,
       photo_url = excluded.photo_url,
       last_seen_at = excluded.last_seen_at`
  )
    .bind(user.uid, user.email, user.name, user.photoURL, now, now)
    .run();
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

export async function listConnections(env: Env, uid: string): Promise<ConnectionRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT platform, account_id, account_label, status, expires_at, created_at, updated_at FROM connections WHERE firebase_uid = ?'
  )
    .bind(uid)
    .all<ConnectionRow>();
  return results ?? [];
}

export async function getConnection(env: Env, uid: string, platform: string) {
  return env.DB.prepare(
    'SELECT * FROM connections WHERE firebase_uid = ? AND platform = ?'
  )
    .bind(uid, platform)
    .first<{
      access_token: string;
      refresh_token: string | null;
      expires_at: number | null;
      account_id: string | null;
      account_label: string | null;
      status: string;
    }>();
}

export async function saveConnection(
  env: Env,
  uid: string,
  conn: {
    platform: string;
    access_token: string;
    refresh_token: string | null;
    expires_at: number | null;
    account_id: string | null;
    account_label: string | null;
  }
): Promise<void> {
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO connections (firebase_uid, platform, access_token, refresh_token, expires_at, account_id, account_label, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'connected', ?, ?)
     ON CONFLICT(firebase_uid, platform) DO UPDATE SET
       access_token = excluded.access_token,
       refresh_token = excluded.refresh_token,
       expires_at = excluded.expires_at,
       account_id = excluded.account_id,
       account_label = excluded.account_label,
       status = 'connected',
       updated_at = excluded.updated_at`
  )
    .bind(
      uid,
      conn.platform,
      conn.access_token,
      conn.refresh_token,
      conn.expires_at,
      conn.account_id,
      conn.account_label,
      now,
      now
    )
    .run();
}

export async function deleteConnection(env: Env, uid: string, platform: string): Promise<void> {
  await env.DB.prepare('DELETE FROM connections WHERE firebase_uid = ? AND platform = ?')
    .bind(uid, platform)
    .run();
}
