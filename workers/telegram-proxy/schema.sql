-- Meeting invites (Cloudflare D1)
CREATE TABLE IF NOT EXISTS invites (
  code TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  alias TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL DEFAULT '',
  first_name TEXT NOT NULL DEFAULT '',
  completed INTEGER NOT NULL DEFAULT 0,
  burned INTEGER NOT NULL DEFAULT 0,
  short_url TEXT,
  open_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_invites_chat ON invites(chat_id);
CREATE INDEX IF NOT EXISTS idx_invites_chat_open ON invites(chat_id, completed, burned);

CREATE TABLE IF NOT EXISTS chat_state (
  chat_id TEXT PRIMARY KEY,
  pending TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
