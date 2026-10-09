-- OSC Payment Academy v4.0.0-rc.1.22 · Licencias por módulo, productos separados y uso de licencias
-- Se ejecuta UNA vez sobre la base D1 "osc-academy". Es idempotente (se puede repetir sin duplicar datos).
-- El código también crea las tablas si faltan; este script además preserva los accesos actuales.

PRAGMA foreign_keys = ON;

-- 1) Módulos habilitados por consultora (ficha de la consultora en el Panel OSC).
CREATE TABLE IF NOT EXISTS tenant_module_access (
  tenant_id TEXT NOT NULL, module_key TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 0,
  updated_by TEXT, updated_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, module_key), FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- 2) Registro de actividad (un renglón por usuario, día y módulo) para el panel "Uso de licencias".
CREATE TABLE IF NOT EXISTS user_activity (
  user_id TEXT NOT NULL, day TEXT NOT NULL, module_key TEXT NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0, first_at TEXT NOT NULL, last_at TEXT NOT NULL,
  PRIMARY KEY (user_id, day, module_key), FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_user_activity_day ON user_activity(day, user_id);

-- 3) Monitoreo en Vivo pasa a ser un producto con licencia propia.
INSERT OR IGNORE INTO products(id,name,slug,core_enabled,status,created_at,updated_at)
VALUES('product_live_monitoring','OSC Monitoreo en Vivo de Autorizaciones','live-monitoring',0,'ACTIVE',datetime('now'),datetime('now'));

--    Hasta rc.1.21 el Monitoreo venía con la licencia de Analytics: quien la tenía conserva el Monitoreo.
INSERT INTO licenses(id,tenant_id,product_id,cohort_id,license_type,starts_at,expires_at,seat_limit,status,created_at,updated_at)
SELECT 'lic_live_' || l.id, l.tenant_id, 'product_live_monitoring', l.cohort_id, l.license_type, l.starts_at, l.expires_at, l.seat_limit, l.status, datetime('now'), datetime('now')
FROM licenses l
WHERE l.product_id = 'product_authorization_analytics'
  AND NOT EXISTS (SELECT 1 FROM licenses x WHERE x.tenant_id = l.tenant_id AND x.product_id = 'product_live_monitoring');

-- 4) Ediciones de curso existentes: eBook, Banco simulado y Switch del Adquirente estaban siempre visibles.
--    Se habilitan para no quitar nada sin aviso (se pueden desactivar desde "Alumnos").
CREATE TABLE IF NOT EXISTS cohort_module_access (
  cohort_id TEXT NOT NULL, module_key TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 0, enabled_at TEXT,
  updated_by TEXT, updated_at TEXT NOT NULL,
  PRIMARY KEY (cohort_id, module_key), FOREIGN KEY (cohort_id) REFERENCES cohorts(id), FOREIGN KEY (updated_by) REFERENCES users(id)
);
INSERT OR IGNORE INTO cohort_module_access(cohort_id,module_key,enabled,enabled_at,updated_by,updated_at)
SELECT c.id, m.k, 1, datetime('now'), NULL, datetime('now')
FROM cohorts c, (SELECT 'ebook' AS k UNION ALL SELECT 'banco_simulado' UNION ALL SELECT 'switch_adquirente') m;

-- Las consultoras existentes NO necesitan migración: sin ficha de módulos siguen viendo todo
-- hasta que se editen desde el Panel OSC.
