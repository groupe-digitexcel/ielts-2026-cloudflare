CREATE TABLE IF NOT EXISTS exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  exam_type TEXT DEFAULT 'full',
  difficulty TEXT DEFAULT 'mixed',
  sections TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  answers TEXT NOT NULL,
  score TEXT NOT NULL,
  band_overall REAL DEFAULT 0,
  submitted_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_reference_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  source_type TEXT DEFAULT 'admin_upload',
  r2_key TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_reference_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference_set_id INTEGER NOT NULL,
  section_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS generated_exam_lineage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  based_on_references TEXT NOT NULL,
  generation_prompt TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT NOT NULL,
  account_number TEXT,
  status TEXT DEFAULT 'pending',
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_reference_sections_set ON exam_reference_sections(reference_set_id);
CREATE INDEX IF NOT EXISTS idx_reference_sets_domain ON exam_reference_sets(domain);
CREATE INDEX IF NOT EXISTS idx_generated_exam_lineage_exam ON generated_exam_lineage(exam_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
