PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS api_clients (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL DEFAULT 'default',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_daily_usage (
  client_id TEXT NOT NULL,
  usage_date TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  success_count INTEGER NOT NULL DEFAULT 0 CHECK (success_count >= 0),
  error_count INTEGER NOT NULL DEFAULT 0 CHECK (error_count >= 0),
  last_request_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (client_id, usage_date),
  FOREIGN KEY (client_id) REFERENCES api_clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS api_daily_usage_date_idx
  ON api_daily_usage(usage_date, request_count DESC);

CREATE TABLE IF NOT EXISTS api_global_daily_usage (
  usage_date TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  success_count INTEGER NOT NULL DEFAULT 0 CHECK (success_count >= 0),
  error_count INTEGER NOT NULL DEFAULT 0 CHECK (error_count >= 0),
  last_request_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
