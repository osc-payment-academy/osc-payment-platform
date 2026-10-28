-- OSC Payment Academy v4.0.0-rc.1.49 · TestLab
-- Opcional: el Worker crea estas tablas solo la primera vez que se usa TestLab (CREATE TABLE IF NOT EXISTS).
-- Correr a mano solo si se prefiere dejarlas creadas antes del primer uso:
--   npx wrangler d1 execute osc-academy --remote --file=MIGRATION_v4.0.0-rc.1.49_TESTLAB.sql

INSERT OR IGNORE INTO products(id,name,slug,core_enabled,status,created_at,updated_at)
VALUES('product_testlab','OSC TestLab','testlab',0,'ACTIVE',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));

-- Perfil del ambiente de desarrollo: uno por tenant (compartido por los usuarios del banco; lo edita el TENANT_ADMIN).
CREATE TABLE IF NOT EXISTS testlab_profiles (tenant_id TEXT PRIMARY KEY,profile_json TEXT NOT NULL,updated_by TEXT,updated_at TEXT NOT NULL);

-- Tarjetas de prueba del banco: por tenant. PAN / vencimiento / PIN block cifrados (AES-GCM con el secreto TESTLAB_KEY).
CREATE TABLE IF NOT EXISTS testlab_cards (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,network TEXT NOT NULL,alias TEXT NOT NULL,masked_pan TEXT NOT NULL,secret_enc TEXT NOT NULL,meta_json TEXT,status TEXT NOT NULL DEFAULT 'ACTIVE',created_by TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_testlab_cards_tenant ON testlab_cards(tenant_id,status);

-- Pruebas: por tenant Y por usuario (cada usuario ve solo las suyas). Evidencia enmascarada.
CREATE TABLE IF NOT EXISTS testlab_runs (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,network TEXT NOT NULL,channel TEXT,kind TEXT,scenario TEXT,dev_version TEXT NOT NULL,expected_code TEXT,received_code TEXT,verdict TEXT NOT NULL,conformity INTEGER,ms INTEGER,rules_version TEXT NOT NULL,manual_ref TEXT,card_alias TEXT,request_masked TEXT,response_masked TEXT,checks_json TEXT,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_testlab_runs_owner ON testlab_runs(tenant_id,user_id,created_at);

-- Escenarios guardados: por tenant y usuario.
CREATE TABLE IF NOT EXISTS testlab_scenarios (tenant_id TEXT NOT NULL,user_id TEXT NOT NULL,payload_json TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(tenant_id,user_id));
