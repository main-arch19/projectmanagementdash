-- ─── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE agent_action_status AS ENUM ('pending', 'approved', 'dismissed');

CREATE TYPE agent_action_type AS ENUM (
  'draft_reminder',
  'file_document',
  'update_stage',
  'mark_paid',
  'create_task',
  'nl_update',
  'nl_query_result'
);

-- ─── agent_actions ────────────────────────────────────────────────────────────
-- Stores every AI-proposed action waiting for human approval.
-- Agents write rows here; humans approve or dismiss via the UI.
-- Approved actions are executed by the server and marked approved.
CREATE TABLE agent_actions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          agent_action_type   NOT NULL,
  payload       JSONB               NOT NULL,
  display_text  TEXT                NOT NULL,
  status        agent_action_status NOT NULL DEFAULT 'pending',
  approved_at   TIMESTAMPTZ,
  dismissed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER agent_actions_updated_at
  BEFORE UPDATE ON agent_actions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_agent_actions_status     ON agent_actions (status);
CREATE INDEX idx_agent_actions_type       ON agent_actions (type);
CREATE INDEX idx_agent_actions_created_at ON agent_actions (created_at DESC);
