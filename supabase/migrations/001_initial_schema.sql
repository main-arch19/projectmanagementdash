-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enum types ────────────────────────────────────────────────────────────────
CREATE TYPE client_status AS ENUM ('active', 'archived');
CREATE TYPE project_stage AS ENUM ('intake', 'in_progress', 'awaiting_payment', 'done');
CREATE TYPE payment_status AS ENUM ('unpaid', 'sent', 'overdue', 'paid');
CREATE TYPE file_category AS ENUM ('contract', 'invoice', 'receipt', 'deliverable', 'other');

-- ─── updated_at trigger function ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── clients ──────────────────────────────────────────────────────────────────
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  company     TEXT,
  status      client_status NOT NULL DEFAULT 'active',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_clients_status ON clients (status);

-- ─── projects ─────────────────────────────────────────────────────────────────
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  stage       project_stage NOT NULL DEFAULT 'intake',
  value       NUMERIC(12, 2),
  start_date  DATE,
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_projects_client_id ON projects (client_id);
CREATE INDEX idx_projects_stage     ON projects (stage);
CREATE INDEX idx_projects_due_date  ON projects (due_date);

-- ─── payments ─────────────────────────────────────────────────────────────────
-- overdue is DERIVED: status != 'paid' AND due_date < NOW() — never stored
CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  client_id         UUID NOT NULL REFERENCES clients  (id) ON DELETE CASCADE,
  amount            NUMERIC(12, 2) NOT NULL,
  description       TEXT,
  due_date          DATE,
  status            payment_status NOT NULL DEFAULT 'unpaid',
  paid_at           TIMESTAMPTZ,
  reminder_sent_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_payments_project_id ON payments (project_id);
CREATE INDEX idx_payments_client_id  ON payments (client_id);
CREATE INDEX idx_payments_status     ON payments (status);
CREATE INDEX idx_payments_due_date   ON payments (due_date);

-- ─── files ────────────────────────────────────────────────────────────────────
CREATE TABLE files (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES clients  (id) ON DELETE CASCADE,
  project_id        UUID          REFERENCES projects (id) ON DELETE SET NULL,
  storage_path      TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  category          file_category NOT NULL DEFAULT 'other',
  extracted_fields  JSONB,
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_files_client_id  ON files (client_id);
CREATE INDEX idx_files_project_id ON files (project_id);
CREATE INDEX idx_files_category   ON files (category);

-- ─── tasks ────────────────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  payment_id  UUID          REFERENCES payments (id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  reason      TEXT,
  due_date    DATE,
  done        BOOLEAN NOT NULL DEFAULT FALSE,
  priority    INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_tasks_project_id ON tasks (project_id);
CREATE INDEX idx_tasks_payment_id ON tasks (payment_id);
CREATE INDEX idx_tasks_done       ON tasks (done);
CREATE INDEX idx_tasks_due_date   ON tasks (due_date);
CREATE INDEX idx_tasks_priority   ON tasks (priority);
