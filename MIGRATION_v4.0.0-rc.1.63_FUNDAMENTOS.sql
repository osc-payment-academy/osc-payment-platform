-- rc.1.63 · Fundamentos y Arquitectura. Opcional: src/index.js crea la tabla solo en el primer uso.
CREATE TABLE IF NOT EXISTS user_fundamentos_progress (
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  viewed_at TEXT,
  quiz_score INTEGER,
  quiz_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(user_id,lesson_id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
