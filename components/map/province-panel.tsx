'use client'

import { useState, useMemo } from 'react'
import { Company } from '@/lib/types'
import { ScoreBadge } from '@/components/ui/score-badge'

interface ProvincePanelProps {
  regionName: string | null
  country: string
  companies: Company[]
  onClose: () => void
  onCompanyClick: (company: Company) => void
}

type SortOption = 'pe_score' | 'revenue' | 'name'

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}€ ${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}€ ${Math.round(abs / 1_000)}K`
  return `${sign}€ ${Math.round(abs)}`
}

export function ProvincePanel({
  regionName,
  country,
  companies,
  onClose,
  onCompanyClick,
}: ProvincePanelProps) {
  const [sortBy, setSortBy] = useState<SortOption>('pe_score')

  const avgScore = useMemo(() => {
    const scored = companies.filter((c) => c.pe_score !== null)
    if (scored.length === 0) return null
    return Math.round(scored.reduce((sum, c) => sum + (c.pe_score || 0), 0) / scored.length)
  }, [companies])

  const sortedCompanies = useMemo(() => {
    const sorted = [...companies]
    switch (sortBy) {
      case 'pe_score':
        sorted.sort((a, b) => (b.pe_score ?? -1) - (a.pe_score ?? -1))
        break
      case 'revenue':
        sorted.sort((a, b) => (b.revenue_y1 ?? 0) - (a.revenue_y1 ?? 0))
        break
      case 'name':
        sorted.sort((a, b) => a.company_name.localeCompare(b.company_name))
        break
    }
    return sorted
  }, [companies, sortBy])

  const isOpen = regionName !== null

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'pe_score', label: 'PE Score' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'name', label: 'Name' },
  ]

  const getProfitColor = (flag: string | null) => {
    if (flag === 'Profitable') return '#4ade80'
    if (flag === 'Loss-making') return '#f87171'
    return '#555555'
  }

  return (
    <div
      className="fixed top-0 right-0 h-full z-40 flex flex-col"
      style={{
        width: 400,
        background: '#111111',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        transform: isOpen ? 'translateX(0)' : 'translateX(400px)',
        transition: 'transform 250ms ease',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      {/* Header */}
      <div
        className="shrink-0 p-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold" style={{ color: '#f5f5f5' }}>
              {regionName}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#888888' }}>
              {country} · {companies.length} companies
              {avgScore !== null && ` · Avg PE: ${avgScore}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888888',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2 mt-3">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className="px-2.5 py-1 rounded-full text-xs"
              style={{
                background: sortBy === opt.key ? 'rgba(212,168,67,0.12)' : 'transparent',
                color: sortBy === opt.key ? '#d4a843' : '#888888',
                border: sortBy === opt.key
                  ? '1px solid rgba(212,168,67,0.2)'
                  : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Company list */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '8px 12px' }}>
        {sortedCompanies.map((company) => (
          <div
            key={company.id}
            onClick={() => onCompanyClick(company)}
            className="p-3 rounded-lg mb-2 cursor-pointer transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.04)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1a1a1a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <ScoreBadge score={company.pe_score} size="sm" />
              <span className="text-sm font-medium truncate" style={{ color: '#f5f5f5' }}>
                {company.company_name}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: '#888888' }}>
              <span>{formatCurrency(company.revenue_y1)}</span>
              <span>{company.employees_y1 ?? '—'} emp</span>
              <span>{company.sub_sector}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span style={{ color: '#888888' }}>{company.city}</span>
              <span style={{ color: getProfitColor(company.profitability_flag) }}>
                {company.profitability_flag ?? 'Unknown'}
              </span>
            </div>
          </div>
        ))}
        {sortedCompanies.length === 0 && isOpen && (
          <div className="py-8 text-center text-xs" style={{ color: '#555555' }}>
            No companies in this region.
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="shrink-0 p-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button
          className="w-full py-2 rounded text-xs font-medium"
          style={{
            background: 'rgba(212,168,67,0.12)',
            color: '#d4a843',
            border: '1px solid rgba(212,168,67,0.2)',
            cursor: 'pointer',
          }}
        >
          Export region → Excel
        </button>
      </div>
    </div>
  )
}
