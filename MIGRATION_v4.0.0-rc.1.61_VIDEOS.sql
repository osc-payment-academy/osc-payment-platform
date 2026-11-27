-- rc.1.61 · Videos de ayuda. Opcional: src/index.js crea la tabla solo en el primer uso.
CREATE TABLE IF NOT EXISTS user_video_views (
  user_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  first_seen_at TEXT,
  watched_90 INTEGER NOT NULL DEFAULT 0,
  dont_show INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(user_id,video_id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
