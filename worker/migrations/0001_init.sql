CREATE TABLE IF NOT EXISTS users (
  firebase_uid TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  photo_url TEXT,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS connections (
  firebase_uid TEXT NOT NULL,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at INTEGER,
  account_id TEXT,
  account_label TEXT,
  status TEXT NOT NULL DEFAULT 'connected',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (firebase_uid, platform),
  FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  firebase_uid TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_min INTEGER,
  price_max INTEGER,
  category TEXT,
  condition TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_listings_user ON listings(firebase_uid, created_at DESC);

CREATE TABLE IF NOT EXISTS postings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  external_id TEXT,
  external_url TEXT,
  status TEXT NOT NULL,
  posted_at INTEGER,
  error TEXT,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_postings_listing ON postings(listing_id);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firebase_uid TEXT NOT NULL,
  platform TEXT NOT NULL,
  thread_id TEXT,
  listing_id TEXT,
  from_user TEXT,
  body TEXT,
  received_at INTEGER NOT NULL,
  replied_at INTEGER,
  FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(firebase_uid, received_at DESC);
