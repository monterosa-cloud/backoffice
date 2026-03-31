-- Migration: Create critique_logs table for the meta-critic agent

CREATE TABLE IF NOT EXISTS critique_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            UUID NOT NULL,
  run_at            TIMESTAMPTZ DEFAULT NOW(),
  pipeline          TEXT NOT NULL,
  company_id        UUID REFERENCES companies(id),
  company_name      TEXT,
  failure_class     TEXT,
  severity          TEXT,
  diagnosis         TEXT,
  action_taken      TEXT,
  action_detail     TEXT,
  before_value      TEXT,
  after_value       TEXT,
  human_verified    BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS critique_logs_run_id_idx ON critique_logs(run_id);
CREATE INDEX IF NOT EXISTS critique_logs_pipeline_idx ON critique_logs(pipeline);
CREATE INDEX IF NOT EXISTS critique_logs_severity_idx ON critique_logs(severity);
CREATE INDEX IF NOT EXISTS critique_logs_company_failure_idx ON critique_logs(company_id, failure_class);
