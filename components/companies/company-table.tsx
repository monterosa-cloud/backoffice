'use client'

import { Company } from '@/lib/types'
import { ScoreBadge } from '@/components/ui/score-badge'

interface CompanyTableProps {
  companies: Company[]
  onSort: (field: string, dir: 'asc' | 'desc') => void
  sortField: string
  sortDir: 'asc' | 'desc'
  onRowClick: (company: Company) => void
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000) {
    return `${sign}€ ${(abs / 1_000_000).toFixed(1)}M`
  }
  if (abs >= 1_000) {
    return `${sign}€ ${Math.round(abs / 1_000)}K`
  }
  return `${sign}€ ${Math.round(abs)}`
}

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(1)}%`
}

const COLUMNS: { key: string; label: string; sortable: boolean; align?: string }[] = [
  { key: 'index', label: '#', sortable: false },
  { key: 'company_name', label: 'Company', sortable: true },
  { key: 'country', label: 'Country', sortable: true },
  { key: 'city', label: 'City', sortable: true },
  { key: 'revenue_y1', label: 'Revenue', sortable: true, align: 'right' },
  { key: 'gross_margin_pct', label: 'Gross Margin', sortable: true, align: 'right' },
  { key: 'net_result_y1', label: 'Net Result', sortable: true, align: 'right' },
  { key: 'employees_y1', label: 'Employees', sortable: true, align: 'right' },
  { key: 'pe_score', label: 'PE Score', sortable: true, align: 'center' },
  { key: 'margin_trend', label: 'Trend', sortable: true, align: 'center' },
  { key: 'flags', label: 'Flags', sortable: false },
]

export function CompanyTable({ companies, onSort, sortField, sortDir, onRowClick }: CompanyTableProps) {
  const handleSort = (key: string) => {
    if (!COLUMNS.find((c) => c.key === key)?.sortable) return
    const newDir = sortField === key && sortDir === 'asc' ? 'desc' : 'asc'
    onSort(key, newDir)
  }

  const getSortIndicator = (key: string) => {
    if (sortField !== key) return null
    return sortDir === 'asc' ? ' ▲' : ' ▼'
  }

  const getTrendColor = (trend: string | null) => {
    if (trend === 'Growing') return '#4ade80'
    if (trend === 'Declining') return '#f87171'
    return '#888888'
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#111111', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap ${
                  col.sortable ? 'cursor-pointer select-none hover:text-[#f5f5f5]' : ''
                }`}
                style={{
                  textAlign: (col.align as 'left' | 'right' | 'center') || 'left',
                  color: '#888888',
                  position: 'sticky',
                  top: 0,
                  background: '#111111',
                  zIndex: 10,
                }}
              >
                {col.label}
                {getSortIndicator(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {companies.map((company, idx) => {
            const flags = company.investment_flags || []
            const visibleFlags = flags.slice(0, 2)
            const extraCount = flags.length - 2

            return (
              <tr
                key={company.id}
                onClick={() => onRowClick(company)}
                className="cursor-pointer transition-colors"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1a1a1a'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <td className="px-3 py-2.5" style={{ color: '#555555' }}>{idx + 1}</td>
                <td className="px-3 py-2.5 font-medium" style={{ color: '#f5f5f5' }}>
                  {company.company_name}
                </td>
                <td className="px-3 py-2.5" style={{ color: '#888888' }}>{company.country}</td>
                <td className="px-3 py-2.5" style={{ color: '#888888' }}>{company.city}</td>
                <td className="px-3 py-2.5 text-right" style={{ color: '#f5f5f5' }}>
                  {formatCurrency(company.revenue_y1)}
                </td>
                <td className="px-3 py-2.5 text-right" style={{ color: '#888888' }}>
                  {formatPercent(company.gross_margin_pct)}
                </td>
                <td className="px-3 py-2.5 text-right" style={{ color: '#f5f5f5' }}>
                  {formatCurrency(company.net_result_y1)}
                </td>
                <td className="px-3 py-2.5 text-right" style={{ color: '#888888' }}>
                  {company.employees_y1 ?? '—'}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ScoreBadge score={company.pe_score} size="sm" />
                </td>
                <td className="px-3 py-2.5 text-center" style={{ color: getTrendColor(company.margin_trend) }}>
                  {company.margin_trend ?? '—'}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    {visibleFlags.map((flag, i) => (
                      <span
                        key={i}
                        className="inline-block px-1.5 py-0.5 rounded text-[10px]"
                        style={{
                          background: 'rgba(212,168,67,0.12)',
                          color: '#d4a843',
                          border: '1px solid rgba(212,168,67,0.2)',
                        }}
                      >
                        {flag}
                      </span>
                    ))}
                    {extraCount > 0 && (
                      <span className="text-[10px]" style={{ color: '#555555' }}>
                        +{extraCount}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {companies.length === 0 && (
        <div className="py-12 text-center" style={{ color: '#555555' }}>
          No companies match your filters.
        </div>
      )}
    </div>
  )
}
