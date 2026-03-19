'use client'

import { Suspense, useState, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Company } from '@/lib/types'
import { CompanyTable } from '@/components/companies/company-table'
import { CompanyDetailModal } from '@/components/companies/company-detail-modal'
import { useCompanies } from '@/lib/company-context'

const SECTORS = ['HVAC', 'Electrical', 'Fire Safety', 'Multi-trade', 'Access Control'] as const

interface Filters {
  countries: string[]
  scoreMin: number | null
  scoreMax: number | null
  revenueBand: string
  sectors: string[]
  marginTrends: string[]
  profitability: string[]
  search: string
}

const PER_PAGE = 15

function CompaniesPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { companies: allCompanies } = useCompanies()

  const parseFilters = useCallback((): Filters => {
    const countries = searchParams.get('countries')?.split(',').filter(Boolean) || ['Belgium']
    const scoreMin = searchParams.get('score_min') ? Number(searchParams.get('score_min')) : null
    const scoreMax = searchParams.get('score_max') ? Number(searchParams.get('score_max')) : null
    const revenueBand = searchParams.get('revenue_band') || 'All'
    const sectors = searchParams.get('sectors')?.split(',').filter(Boolean) || []
    const marginTrends = searchParams.get('margin_trends')?.split(',').filter(Boolean) || []
    const profitability = searchParams.get('profitability')?.split(',').filter(Boolean) || []
    const search = searchParams.get('search') || ''
    return { countries, scoreMin, scoreMax, revenueBand, sectors, marginTrends, profitability, search }
  }, [searchParams])

  const [filters, setFilters] = useState<Filters>(parseFilters)
  const [sortField, setSortField] = useState(searchParams.get('sort') || 'pe_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>((searchParams.get('dir') as 'asc' | 'desc') || 'desc')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  const updateURL = useCallback(
    (f: Filters, sort: string, dir: string, p: number) => {
      const params = new URLSearchParams()
      if (f.countries.length) params.set('countries', f.countries.join(','))
      if (f.scoreMin !== null) params.set('score_min', String(f.scoreMin))
      if (f.scoreMax !== null) params.set('score_max', String(f.scoreMax))
      if (f.revenueBand !== 'All') params.set('revenue_band', f.revenueBand)
      if (f.sectors.length) params.set('sectors', f.sectors.join(','))
      if (f.marginTrends.length) params.set('margin_trends', f.marginTrends.join(','))
      if (f.profitability.length) params.set('profitability', f.profitability.join(','))
      if (f.search) params.set('search', f.search)
      if (sort !== 'pe_score') params.set('sort', sort)
      if (dir !== 'desc') params.set('dir', dir)
      if (p > 1) params.set('page', String(p))
      const qs = params.toString()
      router.replace(`/companies${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [router]
  )

  const filteredCompanies = useMemo(() => {
    let result = [...allCompanies]

    if (filters.countries.length) {
      result = result.filter((c) => filters.countries.includes(c.country))
    }
    if (filters.scoreMin !== null) {
      result = result.filter((c) => c.pe_score !== null && c.pe_score >= filters.scoreMin!)
    }
    if (filters.scoreMax !== null) {
      result = result.filter((c) => c.pe_score !== null && c.pe_score <= filters.scoreMax!)
    }
    if (filters.revenueBand !== 'All') {
      result = result.filter((c) => c.revenue_band === filters.revenueBand)
    }
    if (filters.sectors.length) {
      result = result.filter((c) => c.sub_sector && filters.sectors.includes(c.sub_sector))
    }
    if (filters.marginTrends.length) {
      result = result.filter((c) => c.margin_trend && filters.marginTrends.includes(c.margin_trend))
    }
    if (filters.profitability.length) {
      result = result.filter((c) => c.profitability_flag && filters.profitability.includes(c.profitability_flag))
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (c) =>
          c.company_name.toLowerCase().includes(q) ||
          (c.city && c.city.toLowerCase().includes(q)) ||
          (c.sub_sector && c.sub_sector.toLowerCase().includes(q))
      )
    }

    result.sort((a, b) => {
      const aVal = a[sortField as keyof Company]
      const bVal = b[sortField as keyof Company]
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const aStr = String(aVal)
      const bStr = String(bVal)
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })

    return result
  }, [allCompanies, filters, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / PER_PAGE))
  const paginatedCompanies = filteredCompanies.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleFilterChange = (updates: Partial<Filters>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)
    setPage(1)
    updateURL(newFilters, sortField, sortDir, 1)
  }

  const handleSort = (field: string, dir: 'asc' | 'desc') => {
    setSortField(field)
    setSortDir(dir)
    updateURL(filters, field, dir, page)
  }

  const handlePageChange = (p: number) => {
    setPage(p)
    updateURL(filters, sortField, sortDir, p)
  }

  const clearFilters = () => {
    const cleared: Filters = {
      countries: ['Belgium'],
      scoreMin: null,
      scoreMax: null,
      revenueBand: 'All',
      sectors: [],
      marginTrends: [],
      profitability: [],
      search: '',
    }
    setFilters(cleared)
    setPage(1)
    setSortField('pe_score')
    setSortDir('desc')
    updateURL(cleared, 'pe_score', 'desc', 1)
  }

  const toggleArrayFilter = (arr: string[], value: string): string[] => {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
  }

  const Checkbox = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <label className="flex items-center gap-2 py-1 cursor-pointer text-sm" style={{ color: checked ? '#f5f5f5' : '#888888' }}>
      <input type="checkbox" checked={checked} onChange={onChange} className="rounded" style={{ accentColor: '#d4a843' }} />
      {label}
    </label>
  )

  return (
    <div className="flex gap-0" style={{ marginLeft: -32, marginTop: -32, minHeight: 'calc(100vh)' }}>
      {/* Filter Sidebar */}
      <aside
        className="shrink-0 overflow-y-auto"
        style={{
          width: 240,
          background: '#0d0d0d',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          padding: '20px 16px',
          height: '100vh',
          position: 'sticky',
          top: 0,
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: '#555555' }}>Filters</h3>
          <button onClick={clearFilters} className="text-xs" style={{ color: '#d4a843', background: 'none', border: 'none', cursor: 'pointer' }}>
            Clear all
          </button>
        </div>

        <div className="mb-5">
          <div className="text-xs font-medium mb-2" style={{ color: '#888888' }}>Country</div>
          {['Belgium', 'France', 'Italy'].map((c) => (
            <Checkbox key={c} checked={filters.countries.includes(c)} onChange={() => handleFilterChange({ countries: toggleArrayFilter(filters.countries, c) })} label={c} />
          ))}
        </div>

        <div className="mb-5">
          <div className="text-xs font-medium mb-2" style={{ color: '#888888' }}>PE Score Range</div>
          <div className="flex items-center gap-2">
            <input type="number" min={0} max={100} placeholder="Min" value={filters.scoreMin ?? ''} onChange={(e) => handleFilterChange({ scoreMin: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-2 py-1.5 rounded text-xs" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', color: '#f5f5f5', outline: 'none' }} />
            <span style={{ color: '#555555' }}>–</span>
            <input type="number" min={0} max={100} placeholder="Max" value={filters.scoreMax ?? ''} onChange={(e) => handleFilterChange({ scoreMax: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-2 py-1.5 rounded text-xs" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', color: '#f5f5f5', outline: 'none' }} />
          </div>
        </div>

        <div className="mb-5">
          <div className="text-xs font-medium mb-2" style={{ color: '#888888' }}>Revenue Band</div>
          {['All', 'Core', 'Adjacent', 'Outside', 'Below target'].map((b) => (
            <label key={b} className="flex items-center gap-2 py-1 cursor-pointer text-sm" style={{ color: filters.revenueBand === b ? '#f5f5f5' : '#888888' }}>
              <input type="radio" name="revenueBand" checked={filters.revenueBand === b} onChange={() => handleFilterChange({ revenueBand: b })} style={{ accentColor: '#d4a843' }} />
              {b}
            </label>
          ))}
        </div>

        <div className="mb-5">
          <div className="text-xs font-medium mb-2" style={{ color: '#888888' }}>Sector</div>
          {SECTORS.map((s) => (
            <Checkbox key={s} checked={filters.sectors.includes(s)} onChange={() => handleFilterChange({ sectors: toggleArrayFilter(filters.sectors, s) })} label={s} />
          ))}
        </div>

        <div className="mb-5">
          <div className="text-xs font-medium mb-2" style={{ color: '#888888' }}>Margin Trend</div>
          {['growing', 'stable', 'declining', 'volatile'].map((t) => (
            <Checkbox key={t} checked={filters.marginTrends.includes(t)} onChange={() => handleFilterChange({ marginTrends: toggleArrayFilter(filters.marginTrends, t) })} label={t} />
          ))}
        </div>

        <div className="mb-5">
          <div className="text-xs font-medium mb-2" style={{ color: '#888888' }}>Profitability</div>
          {['profitable', 'loss-making', 'borderline', 'unknown'].map((p) => (
            <Checkbox key={p} checked={filters.profitability.includes(p)} onChange={() => handleFilterChange({ profitability: toggleArrayFilter(filters.profitability, p) })} label={p} />
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0" style={{ padding: '20px 24px' }}>
        <div className="flex items-center gap-4 mb-4">
          <input
            type="text" placeholder="Search companies..." value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            className="flex-1 max-w-md px-3 py-2 rounded text-sm"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', color: '#f5f5f5', outline: 'none' }}
          />
          <span className="text-sm" style={{ color: '#888888' }}>{filteredCompanies.length} companies</span>
        </div>

        {allCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20" style={{ color: '#555555' }}>
            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm font-medium" style={{ color: '#888888' }}>No companies yet</p>
            <p className="text-xs mt-1">Upload an Excel file to get started</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <CompanyTable companies={paginatedCompanies} onSort={handleSort} sortField={sortField} sortDir={sortDir} onRowClick={setSelectedCompany} />
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page <= 1}
                  className="px-3 py-1.5 rounded text-xs" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', color: page <= 1 ? '#555555' : '#f5f5f5', cursor: page <= 1 ? 'default' : 'pointer' }}>
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => handlePageChange(p)} className="w-8 h-8 rounded text-xs font-medium"
                    style={{ background: p === page ? 'rgba(212,168,67,0.12)' : 'transparent', color: p === page ? '#d4a843' : '#888888', border: p === page ? '1px solid rgba(212,168,67,0.2)' : '1px solid transparent', cursor: 'pointer' }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => handlePageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded text-xs" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', color: page >= totalPages ? '#555555' : '#f5f5f5', cursor: page >= totalPages ? 'default' : 'pointer' }}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <CompanyDetailModal company={selectedCompany} onClose={() => setSelectedCompany(null)} />
    </div>
  )
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>}>
      <CompaniesPageInner />
    </Suspense>
  )
}
