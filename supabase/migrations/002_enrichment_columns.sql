-- Migration: Add enrichment columns to companies table
-- Run this before starting the enrichment pipeline

ALTER TABLE companies ADD COLUMN IF NOT EXISTS
  website_url            TEXT,
  website_discovered_at  TIMESTAMPTZ,
  website_status         TEXT,
  has_maintenance        BOOLEAN,
  has_maintenance_evidence TEXT,
  has_emergency          BOOLEAN,
  has_emergency_evidence TEXT,
  website_modernity      TEXT,
  website_modernity_note TEXT,
  website_confidence     NUMERIC,
  founder_name           TEXT,
  founder_title          TEXT,
  founder_source         TEXT,
  founder_confidence     NUMERIC,
  founder_discovered_at  TIMESTAMPTZ,
  enrichment_status      TEXT,
  enrichment_attempts    INTEGER DEFAULT 0,
  enrichment_notes       TEXT;

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_companies_enrichment_status ON companies(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_companies_website_status ON companies(website_status);
CREATE INDEX IF NOT EXISTS idx_companies_founder_source ON companies(founder_source);
