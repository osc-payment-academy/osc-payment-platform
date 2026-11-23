-- OSC Payment Academy · v4.0.0-rc.1.58 · Versión gratuita
-- Solo CREA tablas nuevas (prefijo free_). No modifica ni lee tablas existentes.
-- Opcional: src/free.js también las crea automáticamente (CREATE TABLE IF NOT EXISTS) en el primer uso.
-- Ejecutar: npx wrangler d1 execute osc-academy --remote --file=MIGRATION_v4.0.0-rc.1.58_FREE_TIER.sql

CREATE TABLE IF NOT EXISTS free_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  company TEXT,
  job_role TEXT,
  country TEXT,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',   -- PENDING (sin confirmar email) | ACTIVE
  verify_token_hash TEXT,
  verify_expires_at TEXT,
  created_at TEXT NOT NULL,
  verified_at TEXT,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS free_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS free_usage (
  user_id TEXT NOT NULL,
  module TEXT NOT NULL,          -- pos | atm
  used INTEGER NOT NULL DEFAULT 0,
  first_at TEXT,
  last_at TEXT,
  PRIMARY KEY (user_id, module)
);

CREATE INDEX IF NOT EXISTS idx_free_sessions_user ON free_sessions(user_id);

-- Consulta útil para ver los registros (leads):
-- SELECT full_name, email, company, job_role, country, status, created_at, last_login_at FROM free_users ORDER BY created_at DESC;
