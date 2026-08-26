PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS authorization_analyses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  analysis_date TEXT NOT NULL,
  source_name TEXT NOT NULL DEFAULT 'TCPHandler',
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'READY',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(tenant_id, analysis_date),
  FOREIGN KEY(tenant_id) REFERENCES tenants(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_authorization_analyses_tenant_date
  ON authorization_analyses(tenant_id, analysis_date DESC);

INSERT OR IGNORE INTO products(id,name,slug,core_enabled,status,created_at,updated_at)
VALUES('product_authorization_analytics','OSC Authorization Analytics','authorization-analytics',0,'ACTIVE',datetime('now'),datetime('now'));
