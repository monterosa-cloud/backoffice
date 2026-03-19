import { NextRequest, NextResponse } from 'next/server'
import { Company } from '@/lib/types'

// Reuse the same mock data generation logic
const SECTORS = ['HVAC', 'Electrical', 'Fire Safety', 'Multi-trade', 'Access Control']
const CITIES_BE = [
  { city: 'Brussels', province: 'Brussels' },
  { city: 'Antwerp', province: 'Antwerpen' },
  { city: 'Ghent', province: 'Oost-Vlaanderen' },
  { city: 'Liège', province: 'Liège' },
  { city: 'Bruges', province: 'West-Vlaanderen' },
  { city: 'Namur', province: 'Namur' },
  { city: 'Leuven', province: 'Vlaams-Brabant' },
  { city: 'Mons', province: 'Hainaut' },
  { city: 'Hasselt', province: 'Limburg' },
  { city: 'Arlon', province: 'Luxembourg' },
]

const COMPANY_NAMES = [
  'ThermoTech BVBA', 'ElectraPro NV', 'FlameGuard SA', 'VentiMax BVBA', 'SecureAccess NV',
  'CoolFlow Systems', 'PowerGrid Solutions', 'FireShield Benelux', 'AirControl Group', 'VoltEdge NV',
  'HeatWave Engineering', 'SwitchPoint BVBA', 'SafeZone Fire', 'DuctMaster SA', 'WireWorks NV',
  'ClimaComfort BVBA', 'SparkLine NV', 'BlazeStop SA', 'AeroVent Group', 'LockTech Solutions',
]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  }
}

function generateMockCompanies(): Company[] {
  const rand = seededRandom(42)
  return COMPANY_NAMES.map((name, i) => {
    const loc = CITIES_BE[i % CITIES_BE.length]
    const sector = SECTORS[Math.floor(rand() * SECTORS.length)]
    const revenueBase = 2_000_000 + rand() * 48_000_000
    const growthRate = -0.1 + rand() * 0.3
    const marginPct = 15 + rand() * 45
    const peScore = Math.round(20 + rand() * 70)
    const employees = Math.round(15 + rand() * 280)
    const trends: ('Growing' | 'Stable' | 'Declining')[] = ['Growing', 'Stable', 'Declining']
    const trend = trends[Math.floor(rand() * 3)]
    const profStates = ['Profitable', 'Profitable', 'Profitable', 'Loss-making', 'Unknown']
    const prof = profStates[Math.floor(rand() * profStates.length)]
    const bandOptions = ['Core', 'Adjacent', 'Outside', 'Below target']
    const band = bandOptions[Math.floor(rand() * bandOptions.length)]
    const rev1 = Math.round(revenueBase)

    return {
      id: `mock-${i + 1}`,
      upload_id: null,
      user_id: 'mock-user',
      company_name: name,
      country: 'Belgium',
      city: loc.city,
      province: loc.province,
      address: null,
      vat_number: null,
      cw_url: null,
      website: null,
      sub_sector: sector,
      service_type: null,
      revenue_band: band,
      ownership: null,
      latest_year: 2023,
      revenue_y1: rev1,
      revenue_y2: Math.round(rev1 * 0.92),
      revenue_y3: Math.round(rev1 * 0.85),
      revenue_y4: Math.round(rev1 * 0.78),
      gross_margin_y1: Math.round(rev1 * marginPct / 100),
      gross_margin_y2: Math.round(rev1 * 0.92 * (marginPct - 2) / 100),
      gross_margin_y3: Math.round(rev1 * 0.85 * (marginPct - 4) / 100),
      gross_margin_y4: Math.round(rev1 * 0.78 * (marginPct - 5) / 100),
      net_result_y1: Math.round(rev1 * (marginPct - 25) / 100),
      net_result_y2: Math.round(rev1 * 0.92 * (marginPct - 27) / 100),
      net_result_y3: Math.round(rev1 * 0.85 * (marginPct - 28) / 100),
      net_result_y4: Math.round(rev1 * 0.78 * (marginPct - 29) / 100),
      equity_y1: Math.round(rev1 * 0.4),
      equity_y2: Math.round(rev1 * 0.37),
      equity_y3: Math.round(rev1 * 0.34),
      equity_y4: Math.round(rev1 * 0.31),
      employees_y1: employees,
      employees_y2: Math.round(employees * 0.93),
      employees_y3: Math.round(employees * 0.87),
      employees_y4: Math.round(employees * 0.82),
      revenue_cagr_3y: Math.round(growthRate * 100 * 10) / 10,
      gross_margin_pct: Math.round(marginPct * 10) / 10,
      net_margin_pct: Math.round((marginPct - 25) * 10) / 10,
      margin_trend: trend,
      profitability_flag: prof,
      equity_flag: null,
      pe_score: peScore,
      score_revenue_fit: Math.min(25, Math.round(peScore * 0.25)),
      score_financial_health: Math.min(25, Math.round(peScore * 0.25)),
      score_growth_quality: Math.min(25, Math.round(peScore * 0.25)),
      score_operational_fit: Math.min(25, Math.round(peScore * 0.25)),
      investment_flags: [],
      analyst_summary: null,
      fetch_status: 'done',
      verification_passed: true,
      verification_issues: [],
      source: 'mock',
      description: null,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    } as Company
  })
}

const MOCK_COMPANIES = generateMockCompanies()

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const country = searchParams.get('country')
  const scoreMin = searchParams.get('score_min') ? Number(searchParams.get('score_min')) : null
  const scoreMax = searchParams.get('score_max') ? Number(searchParams.get('score_max')) : null
  const revenueBand = searchParams.get('revenue_band')
  const sector = searchParams.get('sector')
  const marginTrend = searchParams.get('margin_trend')
  const pageParam = Number(searchParams.get('page')) || 1
  const perPage = Number(searchParams.get('per_page')) || 15
  const sort = searchParams.get('sort') || 'pe_score'
  const dir = searchParams.get('dir') || 'desc'
  const search = searchParams.get('search')

  let filtered = [...MOCK_COMPANIES]

  if (country) {
    filtered = filtered.filter((c) => c.country === country)
  }
  if (scoreMin !== null) {
    filtered = filtered.filter((c) => c.pe_score !== null && c.pe_score >= scoreMin)
  }
  if (scoreMax !== null) {
    filtered = filtered.filter((c) => c.pe_score !== null && c.pe_score <= scoreMax)
  }
  if (revenueBand) {
    filtered = filtered.filter((c) => c.revenue_band === revenueBand)
  }
  if (sector) {
    filtered = filtered.filter((c) => c.sub_sector === sector)
  }
  if (marginTrend) {
    filtered = filtered.filter((c) => c.margin_trend === marginTrend)
  }
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      (c) =>
        c.company_name.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q))
    )
  }

  // Sort
  filtered.sort((a, b) => {
    const aVal = a[sort as keyof Company]
    const bVal = b[sort as keyof Company]
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return dir === 'asc' ? aVal - bVal : bVal - aVal
    }
    return dir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal))
  })

  const total = filtered.length
  const start = (pageParam - 1) * perPage
  const companies = filtered.slice(start, start + perPage)

  return NextResponse.json({
    companies,
    total,
    page: pageParam,
  })
}
