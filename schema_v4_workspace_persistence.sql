PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workspace_data (
  workspace_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(workspace_id) REFERENCES workspaces_v4(id) ON DELETE CASCADE,
  FOREIGN KEY(tenant_id) REFERENCES tenants(id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_data_tenant_user
  ON workspace_data(tenant_id,user_id,product_id);
