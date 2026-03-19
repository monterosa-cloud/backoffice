import * as XLSX from 'xlsx'
import type { ParsedCompany, Company } from '@/lib/types'

export type { ParsedCompany }

export interface ColumnValidation {
  name: string;
  found: boolean;
  coverage: string;
  required: boolean;
}

export interface ParseResult {
  companies: ParsedCompany[];
  fullCompanies: Company[];
  columns: ColumnValidation[];
  rowCount: number;
  sheetName: string;
}

function num(row: Record<string, unknown>, key: string): number | null {
  const v = row[key]
  if (v == null || v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

function str(row: Record<string, unknown>, key: string): string | null {
  const v = row[key]
  if (v == null || v === '') return null
  return String(v).trim()
}

function flags(row: Record<string, unknown>, key: string): string[] {
  const v = str(row, key)
  if (!v) return []
  return v.split(' | ').filter(Boolean)
}

export function parseExcel(buffer: ArrayBuffer): ParseResult {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheetName = wb.SheetNames.includes("Belgium (2)")
    ? "Belgium (2)" : wb.SheetNames[0]
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: null }) as Record<string, unknown>[]

  const columnMap: Record<string, { required: boolean }> = {
    "Company Name": { required: true },
    "Country": { required: false },
    "City": { required: true },
    "Province": { required: false },
    "VAT Number": { required: false },
    "CW URL": { required: false },
    "PE Score": { required: false },
    "Sub-Sector": { required: false },
    "Service Type": { required: false },
    "Revenue Band": { required: false },
  }

  const firstRow = rows[0] || {}
  const columns: ColumnValidation[] = Object.entries(columnMap).map(([name, config]) => {
    const found = name in firstRow
    const filledCount = found ? rows.filter(r => r[name] != null && r[name] !== "").length : 0
    return {
      name,
      found,
      coverage: found ? `${filledCount}/${rows.length} rows` : "not found",
      required: config.required,
    }
  })

  // Check if this is an enriched file (has CW_ columns from the scraper)
  const isEnriched = 'CW_Revenue_Y1' in firstRow || 'PE_Score_New' in firstRow

  const companies: ParsedCompany[] = rows
    .map((row) => ({
      company_name: (row["Company Name"] as string) ?? "",
      country: (row["Country"] as string) ?? "Belgium",
      city: (row["City"] as string) ?? null,
      region: (row["Region"] as string) ?? (row["Province"] as string) ?? null,
      vat_number: (row["VAT Number"] as string) ?? null,
      cw_url: (row["CW URL"] as string) ?? null,
      pe_score: num(row, "PE Score") ?? num(row, "PE_Score_New"),
      sub_sector: (row["Sub-Sector"] as string) ?? null,
      service_type: (row["Service Type"] as string) ?? null,
      revenue_band: str(row, "Revenue Band") ?? str(row, "Revenue_Band"),
      revenue_y1: num(row, "Revenue (€)") ?? num(row, "CW_Revenue_Y1"),
      gross_margin_y1: num(row, "Gross Margin") ?? num(row, "CW_GrossMargin_Y1"),
      net_result_y1: num(row, "Net Result (€)") ?? num(row, "CW_NetResult_Y1"),
      equity_y1: num(row, "Equity") ?? num(row, "CW_Equity_Y1"),
      employees_y1: num(row, "Employees") ?? num(row, "CW_Employees_Y1"),
    }))
    .filter(c => c.company_name.length > 0)

  // Build full Company objects (with enriched data if available)
  const fullCompanies: Company[] = rows
    .filter(r => r["Company Name"] && String(r["Company Name"]).trim().length > 0)
    .map((row, i) => {
      const name = String(row["Company Name"]).trim()
      const peScore = num(row, "PE_Score_New") ?? num(row, "PE Score")
      return {
        id: `upload-${Date.now()}-${i}`,
        upload_id: null,
        user_id: '',
        company_name: name,
        country: str(row, "Country") ?? 'Belgium',
        city: str(row, "City"),
        province: str(row, "Province") ?? str(row, "Region"),
        address: null,
        vat_number: str(row, "VAT Number"),
        cw_url: str(row, "CW_URL_Used") ?? str(row, "CW URL"),
        website: null,
        sub_sector: str(row, "Sub-Sector"),
        service_type: str(row, "Service Type"),
        revenue_band: str(row, "Revenue_Band") ?? str(row, "Revenue Band"),
        ownership: null,
        latest_year: num(row, "CW_Latest_Year"),
        revenue_y1: num(row, "CW_Revenue_Y1") ?? num(row, "Revenue (€)"),
        revenue_y2: num(row, "CW_Revenue_Y2"),
        revenue_y3: num(row, "CW_Revenue_Y3"),
        revenue_y4: num(row, "CW_Revenue_Y4"),
        gross_margin_y1: num(row, "CW_GrossMargin_Y1") ?? num(row, "Gross Margin"),
        gross_margin_y2: num(row, "CW_GrossMargin_Y2"),
        gross_margin_y3: num(row, "CW_GrossMargin_Y3"),
        gross_margin_y4: num(row, "CW_GrossMargin_Y4"),
        net_result_y1: num(row, "CW_NetResult_Y1") ?? num(row, "Net Result (€)"),
        net_result_y2: num(row, "CW_NetResult_Y2"),
        net_result_y3: num(row, "CW_NetResult_Y3"),
        net_result_y4: num(row, "CW_NetResult_Y4"),
        equity_y1: num(row, "CW_Equity_Y1") ?? num(row, "Equity"),
        equity_y2: num(row, "CW_Equity_Y2"),
        equity_y3: num(row, "CW_Equity_Y3"),
        equity_y4: num(row, "CW_Equity_Y4"),
        employees_y1: num(row, "CW_Employees_Y1") ?? num(row, "Employees"),
        employees_y2: num(row, "CW_Employees_Y2"),
        employees_y3: num(row, "CW_Employees_Y3"),
        employees_y4: num(row, "CW_Employees_Y4"),
        revenue_cagr_3y: num(row, "Revenue_CAGR_3Y"),
        gross_margin_pct: num(row, "GrossMargin_Pct_Latest"),
        net_margin_pct: num(row, "Net_Margin_Pct_Latest"),
        margin_trend: str(row, "Margin_Trend"),
        profitability_flag: str(row, "Profitability_Flag"),
        equity_flag: str(row, "Equity_Flag"),
        pe_score: peScore,
        score_revenue_fit: num(row, "Score_Revenue_Fit"),
        score_financial_health: num(row, "Score_Financial_Health"),
        score_growth_quality: num(row, "Score_Growth_Quality"),
        score_operational_fit: num(row, "Score_Operational_Fit"),
        investment_flags: flags(row, "Investment_Flags"),
        analyst_summary: str(row, "Analyst_Summary"),
        fetch_status: str(row, "Fetch_Status"),
        verification_passed: row["Verification_Passed"] != null ? Boolean(row["Verification_Passed"]) : null,
        verification_issues: flags(row, "Verification_Issues"),
        source: isEnriched ? 'scored' : 'excel',
        description: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Company
    })

  return { companies, fullCompanies, columns, rowCount: companies.length, sheetName }
}
