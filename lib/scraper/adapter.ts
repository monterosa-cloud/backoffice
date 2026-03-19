/**
 * Scraper Integration Adapter
 * Maps between Supabase company rows and Python scraper dict format.
 * Mirrors orchestrator.py's flatten_result() output columns.
 */

import { Company } from '@/lib/types'

/** Shape returned by orchestrator.py flatten_result() */
export interface ScraperFlatResult {
  CW_URL_Used: string
  Fetch_Status: string
  CW_Latest_Year: number | null
  CW_Revenue_Y1: number | null
  CW_Revenue_Y2: number | null
  CW_Revenue_Y3: number | null
  CW_Revenue_Y4: number | null
  CW_GrossMargin_Y1: number | null
  CW_GrossMargin_Y2: number | null
  CW_GrossMargin_Y3: number | null
  CW_GrossMargin_Y4: number | null
  CW_NetResult_Y1: number | null
  CW_NetResult_Y2: number | null
  CW_NetResult_Y3: number | null
  CW_NetResult_Y4: number | null
  CW_Equity_Y1: number | null
  CW_Equity_Y2: number | null
  CW_Equity_Y3: number | null
  CW_Equity_Y4: number | null
  CW_Employees_Y1: number | null
  CW_Employees_Y2: number | null
  CW_Employees_Y3: number | null
  CW_Employees_Y4: number | null
  YoY_GrossMargin_Pct: number | null
  YoY_NetResult_Pct: number | null
  Revenue_CAGR_3Y: number | null
  GrossMargin_CAGR_3Y: number | null
  GrossMargin_Pct_Latest: number | null
  Net_Margin_Pct_Latest: number | null
  Margin_Trend: string
  Profitability_Flag: string
  Equity_Flag: string
  Revenue_Band: string
  PE_Score_New: number | null
  Score_Revenue_Fit: number | null
  Score_Financial_Health: number | null
  Score_Growth_Quality: number | null
  Score_Operational_Fit: number | null
  Investment_Flags: string
  Analyst_Summary: string
  Verification_Passed: boolean | null
  Verification_Issues: string
}

/**
 * Convert a scraper flat result row (from Book2_pe_scored.xlsx) to a
 * Supabase company upsert payload.
 */
export function scraperResultToCompany(
  row: Record<string, unknown>,
  country: string = 'Belgium'
): Partial<Company> {
  const str = (key: string) => {
    const v = row[key]
    return v != null ? String(v).trim() : null
  }
  const num = (key: string) => {
    const v = row[key]
    if (v == null || v === '') return null
    const n = Number(v)
    return isNaN(n) ? null : n
  }
  const flags = (key: string): string[] => {
    const v = str(key)
    if (!v) return []
    return v.split(' | ').filter(Boolean)
  }

  return {
    company_name: str('Company Name') ?? '',
    country,
    city: str('City') ?? null,
    province: str('Province') ?? null,
    vat_number: str('VAT Number') ?? null,
    sub_sector: str('Sector') ?? null,
    cw_url: str('CW_URL_Used') ?? str('CW URL') ?? null,
    fetch_status: str('Fetch_Status') ?? null,
    latest_year: num('CW_Latest_Year'),
    revenue_y1: num('CW_Revenue_Y1'),
    revenue_y2: num('CW_Revenue_Y2'),
    revenue_y3: num('CW_Revenue_Y3'),
    revenue_y4: num('CW_Revenue_Y4'),
    gross_margin_y1: num('CW_GrossMargin_Y1'),
    gross_margin_y2: num('CW_GrossMargin_Y2'),
    gross_margin_y3: num('CW_GrossMargin_Y3'),
    gross_margin_y4: num('CW_GrossMargin_Y4'),
    net_result_y1: num('CW_NetResult_Y1'),
    net_result_y2: num('CW_NetResult_Y2'),
    net_result_y3: num('CW_NetResult_Y3'),
    net_result_y4: num('CW_NetResult_Y4'),
    equity_y1: num('CW_Equity_Y1'),
    equity_y2: num('CW_Equity_Y2'),
    equity_y3: num('CW_Equity_Y3'),
    equity_y4: num('CW_Equity_Y4'),
    employees_y1: num('CW_Employees_Y1'),
    employees_y2: num('CW_Employees_Y2'),
    employees_y3: num('CW_Employees_Y3'),
    employees_y4: num('CW_Employees_Y4'),
    revenue_cagr_3y: num('Revenue_CAGR_3Y'),
    gross_margin_pct: num('GrossMargin_Pct_Latest'),
    net_margin_pct: num('Net_Margin_Pct_Latest'),
    margin_trend: str('Margin_Trend'),
    profitability_flag: str('Profitability_Flag'),
    equity_flag: str('Equity_Flag'),
    revenue_band: str('Revenue_Band'),
    pe_score: num('PE_Score_New'),
    score_revenue_fit: num('Score_Revenue_Fit'),
    score_financial_health: num('Score_Financial_Health'),
    score_growth_quality: num('Score_Growth_Quality'),
    score_operational_fit: num('Score_Operational_Fit'),
    investment_flags: flags('Investment_Flags'),
    analyst_summary: str('Analyst_Summary'),
    verification_passed: row['Verification_Passed'] != null ? Boolean(row['Verification_Passed']) : null,
    verification_issues: flags('Verification_Issues'),
  }
}

/**
 * Convert a Supabase company row back to the Python scraper input format
 * (for triggering re-scoring via the orchestrator).
 */
export function companyToScraperInput(company: Company): Record<string, string | null> {
  return {
    company_name: company.company_name,
    city: company.city ?? '',
    vat_number: company.vat_number ?? null,
    cw_url: company.cw_url ?? null,
  }
}
