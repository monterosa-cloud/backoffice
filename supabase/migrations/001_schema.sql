CREATE TABLE uploads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename      TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  row_count     INTEGER,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','done','error')),
  error_msg     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

CREATE TABLE companies (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id               UUID REFERENCES uploads(id) ON DELETE SET NULL,
  user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name            TEXT NOT NULL,
  country                 TEXT DEFAULT 'Belgium',
  city                    TEXT,
  province                TEXT,
  address                 TEXT,
  vat_number              TEXT,
  cw_url                  TEXT,
  website                 TEXT,
  sub_sector              TEXT,
  service_type            TEXT,
  revenue_band            TEXT,
  ownership               TEXT,
  latest_year             INTEGER,
  revenue_y1              NUMERIC, revenue_y2 NUMERIC, revenue_y3 NUMERIC, revenue_y4 NUMERIC,
  gross_margin_y1         NUMERIC, gross_margin_y2 NUMERIC, gross_margin_y3 NUMERIC, gross_margin_y4 NUMERIC,
  net_result_y1           NUMERIC, net_result_y2 NUMERIC, net_result_y3 NUMERIC, net_result_y4 NUMERIC,
  equity_y1               NUMERIC, equity_y2 NUMERIC, equity_y3 NUMERIC, equity_y4 NUMERIC,
  employees_y1            NUMERIC, employees_y2 NUMERIC, employees_y3 NUMERIC, employees_y4 NUMERIC,
  revenue_cagr_3y         NUMERIC,
  gross_margin_pct        NUMERIC,
  net_margin_pct          NUMERIC,
  margin_trend            TEXT,
  profitability_flag      TEXT,
  equity_flag             TEXT,
  pe_score                NUMERIC,
  score_revenue_fit       NUMERIC,
  score_financial_health  NUMERIC,
  score_growth_quality    NUMERIC,
  score_operational_fit   NUMERIC,
  investment_flags        TEXT[],
  analyst_summary         TEXT,
  fetch_status            TEXT,
  verification_passed     BOOLEAN,
  verification_issues     TEXT[],
  source                  TEXT DEFAULT 'Companyweb',
  description             TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vat_number, country)
);

ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own uploads" ON uploads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own companies" ON companies FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_companies_country ON companies(country);
CREATE INDEX idx_companies_province ON companies(province);
CREATE INDEX idx_companies_pe_score ON companies(pe_score DESC);
