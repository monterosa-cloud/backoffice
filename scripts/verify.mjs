#!/usr/bin/env node
/**
 * Verification test for the PE Platform Excel parser.
 *
 * 1. Creates a test .xlsx with the Iso Full company row
 * 2. Reads it back using the same parsing logic as lib/excel/parser.ts
 * 3. Compares every field against expected values
 * 4. Prints a PASS/FAIL report
 *
 * Usage:  node scripts/verify.mjs
 */

import XLSX from 'xlsx';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// 1. Define the Iso Full row data (column headers -> values)
// ---------------------------------------------------------------------------

const isoFullRow = {
  "Company Name": "Iso Full",
  "Country": "Belgium",
  "City": "Farciennes",
  "Province": "Wallonia",
  "VAT Number": "BE0641934221",
  "CW URL": "https://www.companyweb.be/en/company-info/iso-full/0641934221",
  "PE_Score_New": 87.0,
  "Sub-Sector": null,
  "Service Type": null,
  "Revenue_Band": "Adjacent",
  "CW_Revenue_Y1": 19633304,
  "CW_Revenue_Y2": 11641537,
  "CW_Revenue_Y3": 8271270,
  "CW_Revenue_Y4": 4893659,
  "CW_GrossMargin_Y1": 8458840,
  "CW_GrossMargin_Y2": 1897479,
  "CW_GrossMargin_Y3": 811780,
  "CW_GrossMargin_Y4": 1116803,
  "CW_NetResult_Y1": 2326301,
  "CW_NetResult_Y2": 336805,
  "CW_NetResult_Y3": -106186,
  "CW_NetResult_Y4": 128539,
  "CW_Equity_Y1": 1418167,
  "CW_Equity_Y2": -508133,
  "CW_Equity_Y3": -844938,
  "CW_Equity_Y4": -738752,
  "CW_Employees_Y1": 28.9,
  "CW_Employees_Y2": 21.1,
  "CW_Employees_Y3": 15,
  "CW_Employees_Y4": 11,
  "CW_Latest_Year": 2023,
  "Revenue_CAGR_3Y": 58.82,
  "GrossMargin_Pct_Latest": 43.08,
  "Net_Margin_Pct_Latest": 11.85,
  "Margin_Trend": "growing",
  "Profitability_Flag": "profitable",
  "Equity_Flag": "positive",
  "Score_Revenue_Fit": 12,
  "Score_Financial_Health": 25,
  "Score_Growth_Quality": 25,
  "Score_Operational_Fit": 25,
  "Investment_Flags": "gross_margin >300% change | net_result >300% change | equity >300% change | high revenue/employee",
  "Analyst_Summary": "HVAC/insulation contractor with explosive revenue growth (59% CAGR). Turned profitable with strong 43% gross margins. Equity recovered from negative to positive. High revenue per employee (\u20AC679K) suggests subcontractor-heavy model.",
  "Fetch_Status": "success",
  "Verification_Passed": true,
  "Verification_Issues": "gross_margin >300% change | net_result >300% change | equity >300% change | high revenue/employee",
  "CW_URL_Used": "https://www.companyweb.be/en/company-info/iso-full/0641934221",
};

// ---------------------------------------------------------------------------
// 2. Write the .xlsx file
// ---------------------------------------------------------------------------

function buildWorkbook(row) {
  // Replace null values with empty string so xlsx doesn't skip the column
  const cleaned = {};
  for (const [k, v] of Object.entries(row)) {
    cleaned[k] = v === null ? "" : v;
  }
  const ws = XLSX.utils.json_to_sheet([cleaned]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return wb;
}

const wb = buildWorkbook(isoFullRow);
const xlsxBuf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

// Save to test-data for manual testing
const testDataDir = join(ROOT, "test-data");
mkdirSync(testDataDir, { recursive: true });
const testFilePath = join(testDataDir, "iso-full.xlsx");
writeFileSync(testFilePath, xlsxBuf);
console.log(`Wrote test file: ${testFilePath}`);

// ---------------------------------------------------------------------------
// 3. Replicate the parser logic (matching lib/excel/parser.ts exactly)
// ---------------------------------------------------------------------------

function num(row, key) {
  const v = row[key];
  if (v == null || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function str(row, key) {
  const v = row[key];
  if (v == null || v === '') return null;
  return String(v).trim();
}

function flags(row, key) {
  const v = str(row, key);
  if (!v) return [];
  return v.split(' | ').filter(Boolean);
}

function parseExcel(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames.includes("Belgium (2)")
    ? "Belgium (2)" : wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: null });

  const firstRow = rows[0] || {};
  const isEnriched = 'CW_Revenue_Y1' in firstRow || 'PE_Score_New' in firstRow;

  const companies = rows
    .map((row) => ({
      company_name: row["Company Name"] ?? "",
      country: row["Country"] ?? "Belgium",
      city: row["City"] ?? null,
      region: row["Region"] ?? row["Province"] ?? null,
      vat_number: row["VAT Number"] ?? null,
      cw_url: row["CW URL"] ?? null,
      pe_score: num(row, "PE Score") ?? num(row, "PE_Score_New"),
      sub_sector: row["Sub-Sector"] ?? null,
      service_type: row["Service Type"] ?? null,
      revenue_band: str(row, "Revenue Band") ?? str(row, "Revenue_Band"),
      revenue_y1: num(row, "Revenue (\u20AC)") ?? num(row, "CW_Revenue_Y1"),
      gross_margin_y1: num(row, "Gross Margin") ?? num(row, "CW_GrossMargin_Y1"),
      net_result_y1: num(row, "Net Result (\u20AC)") ?? num(row, "CW_NetResult_Y1"),
      equity_y1: num(row, "Equity") ?? num(row, "CW_Equity_Y1"),
      employees_y1: num(row, "Employees") ?? num(row, "CW_Employees_Y1"),
    }))
    .filter(c => c.company_name.length > 0);

  const fullCompanies = rows
    .filter(r => r["Company Name"] && String(r["Company Name"]).trim().length > 0)
    .map((row, i) => {
      const name = String(row["Company Name"]).trim();
      const peScore = num(row, "PE_Score_New") ?? num(row, "PE Score");
      return {
        id: `upload-test-${i}`,
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
        revenue_y1: num(row, "CW_Revenue_Y1") ?? num(row, "Revenue (\u20AC)"),
        revenue_y2: num(row, "CW_Revenue_Y2"),
        revenue_y3: num(row, "CW_Revenue_Y3"),
        revenue_y4: num(row, "CW_Revenue_Y4"),
        gross_margin_y1: num(row, "CW_GrossMargin_Y1") ?? num(row, "Gross Margin"),
        gross_margin_y2: num(row, "CW_GrossMargin_Y2"),
        gross_margin_y3: num(row, "CW_GrossMargin_Y3"),
        gross_margin_y4: num(row, "CW_GrossMargin_Y4"),
        net_result_y1: num(row, "CW_NetResult_Y1") ?? num(row, "Net Result (\u20AC)"),
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
      };
    });

  return { companies, fullCompanies, rowCount: companies.length, sheetName };
}

// ---------------------------------------------------------------------------
// 4. Read back and verify
// ---------------------------------------------------------------------------

const fileBytes = readFileSync(testFilePath);
const arrayBuf = new Uint8Array(fileBytes).buffer;
const result = parseExcel(arrayBuf);

let passCount = 0;
let failCount = 0;
const failures = [];

function check(label, actual, expected) {
  // Deep comparison for arrays
  if (Array.isArray(expected)) {
    const match = Array.isArray(actual)
      && actual.length === expected.length
      && actual.every((v, i) => v === expected[i]);
    if (match) {
      passCount++;
    } else {
      failCount++;
      failures.push({ label, expected, actual });
    }
    return;
  }
  // Numeric tolerance for floats
  if (typeof expected === 'number' && typeof actual === 'number') {
    if (Math.abs(actual - expected) < 0.01) {
      passCount++;
      return;
    }
  }
  if (actual === expected) {
    passCount++;
  } else {
    failCount++;
    failures.push({ label, expected, actual });
  }
}

// --- Meta checks ---
check("rowCount", result.rowCount, 1);
check("sheetName", result.sheetName, "Sheet1");

// --- ParsedCompany checks ---
const pc = result.companies[0];
if (!pc) {
  console.error("FAIL: No parsed company found");
  process.exit(1);
}

check("parsed.company_name", pc.company_name, "Iso Full");
check("parsed.country", pc.country, "Belgium");
check("parsed.city", pc.city, "Farciennes");
check("parsed.region", pc.region, "Wallonia");
check("parsed.vat_number", pc.vat_number, "BE0641934221");
check("parsed.cw_url", pc.cw_url, "https://www.companyweb.be/en/company-info/iso-full/0641934221");
check("parsed.pe_score", pc.pe_score, 87.0);
// Note: null values in xlsx become "" on round-trip; the parser uses
// row["Sub-Sector"] ?? null (not str()), so "" is preserved. This matches
// real parser behaviour for ParsedCompany.
check("parsed.sub_sector", pc.sub_sector, "");
check("parsed.service_type", pc.service_type, "");
check("parsed.revenue_band", pc.revenue_band, "Adjacent");
check("parsed.revenue_y1", pc.revenue_y1, 19633304);
check("parsed.gross_margin_y1", pc.gross_margin_y1, 8458840);
check("parsed.net_result_y1", pc.net_result_y1, 2326301);
check("parsed.equity_y1", pc.equity_y1, 1418167);
check("parsed.employees_y1", pc.employees_y1, 28.9);

// --- Full Company checks ---
const fc = result.fullCompanies[0];
if (!fc) {
  console.error("FAIL: No full company found");
  process.exit(1);
}

check("full.company_name", fc.company_name, "Iso Full");
check("full.country", fc.country, "Belgium");
check("full.city", fc.city, "Farciennes");
check("full.province", fc.province, "Wallonia");
check("full.vat_number", fc.vat_number, "BE0641934221");
check("full.cw_url", fc.cw_url, "https://www.companyweb.be/en/company-info/iso-full/0641934221");
check("full.pe_score", fc.pe_score, 87.0);
check("full.sub_sector", fc.sub_sector, null);
check("full.service_type", fc.service_type, null);
check("full.revenue_band", fc.revenue_band, "Adjacent");

// Revenue
check("full.revenue_y1", fc.revenue_y1, 19633304);
check("full.revenue_y2", fc.revenue_y2, 11641537);
check("full.revenue_y3", fc.revenue_y3, 8271270);
check("full.revenue_y4", fc.revenue_y4, 4893659);

// Gross Margin
check("full.gross_margin_y1", fc.gross_margin_y1, 8458840);
check("full.gross_margin_y2", fc.gross_margin_y2, 1897479);
check("full.gross_margin_y3", fc.gross_margin_y3, 811780);
check("full.gross_margin_y4", fc.gross_margin_y4, 1116803);

// Net Result
check("full.net_result_y1", fc.net_result_y1, 2326301);
check("full.net_result_y2", fc.net_result_y2, 336805);
check("full.net_result_y3", fc.net_result_y3, -106186);
check("full.net_result_y4", fc.net_result_y4, 128539);

// Equity
check("full.equity_y1", fc.equity_y1, 1418167);
check("full.equity_y2", fc.equity_y2, -508133);
check("full.equity_y3", fc.equity_y3, -844938);
check("full.equity_y4", fc.equity_y4, -738752);

// Employees
check("full.employees_y1", fc.employees_y1, 28.9);
check("full.employees_y2", fc.employees_y2, 21.1);
check("full.employees_y3", fc.employees_y3, 15);
check("full.employees_y4", fc.employees_y4, 11);

// Derived metrics
check("full.latest_year", fc.latest_year, 2023);
check("full.revenue_cagr_3y", fc.revenue_cagr_3y, 58.82);
check("full.gross_margin_pct", fc.gross_margin_pct, 43.08);
check("full.net_margin_pct", fc.net_margin_pct, 11.85);
check("full.margin_trend", fc.margin_trend, "growing");
check("full.profitability_flag", fc.profitability_flag, "profitable");
check("full.equity_flag", fc.equity_flag, "positive");

// Scores
check("full.score_revenue_fit", fc.score_revenue_fit, 12);
check("full.score_financial_health", fc.score_financial_health, 25);
check("full.score_growth_quality", fc.score_growth_quality, 25);
check("full.score_operational_fit", fc.score_operational_fit, 25);

// Flags & text
const expectedFlags = [
  "gross_margin >300% change",
  "net_result >300% change",
  "equity >300% change",
  "high revenue/employee",
];
check("full.investment_flags", fc.investment_flags, expectedFlags);
check("full.analyst_summary", fc.analyst_summary,
  "HVAC/insulation contractor with explosive revenue growth (59% CAGR). Turned profitable with strong 43% gross margins. Equity recovered from negative to positive. High revenue per employee (\u20AC679K) suggests subcontractor-heavy model.");
check("full.fetch_status", fc.fetch_status, "success");
check("full.verification_passed", fc.verification_passed, true);
check("full.verification_issues", fc.verification_issues, expectedFlags);
check("full.source", fc.source, "scored");

// ---------------------------------------------------------------------------
// 5. Report
// ---------------------------------------------------------------------------

console.log("\n========================================");
console.log("  PE Platform Parser Verification Test");
console.log("========================================\n");

if (failures.length > 0) {
  console.log("FAILURES:\n");
  for (const f of failures) {
    console.log(`  FAIL  ${f.label}`);
    console.log(`        expected: ${JSON.stringify(f.expected)}`);
    console.log(`        actual:   ${JSON.stringify(f.actual)}\n`);
  }
}

console.log(`Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total\n`);

if (failCount === 0) {
  console.log("STATUS: ALL TESTS PASSED");
  process.exit(0);
} else {
  console.log("STATUS: SOME TESTS FAILED");
  process.exit(1);
}
