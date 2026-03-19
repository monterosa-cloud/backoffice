'use client'

import { useEffect, useCallback } from 'react'
import { Company } from '@/lib/types'
import { ScoreBadge } from '@/components/ui/score-badge'

interface CompanyDetailModalProps {
  company: Company | null
  onClose: () => void
}

function formatEuro(value: number | null): string {
  if (value === null || value === undefined) return '—'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  return `${sign}€ ${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function formatEmployees(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return value.toFixed(1)
}

interface ScoreBarProps {
  label: string
  value: number | null
  max: number
}

function ScoreBar({ label, value, max }: ScoreBarProps) {
  const pct = value !== null ? Math.min((value / max) * 100, 100) : 0
  const barColor = value === null
    ? '#555555'
    : value >= (max * 0.55)
      ? '#4ade80'
      : value >= (max * 0.35)
        ? '#fb923c'
        : '#f87171'

  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-xs w-36 shrink-0" style={{ color: '#888888' }}>{label}</span>
      <div className="flex-1 h-2 rounded-full" style={{ background: '#1a1a1a' }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <span className="text-xs w-8 text-right font-medium" style={{ color: '#f5f5f5' }}>
        {value !== null ? value : '—'}
      </span>
    </div>
  )
}

export function CompanyDetailModal({ company, onClose }: CompanyDetailModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (company) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [company, handleKeyDown])

  if (!company) return null

  const years = [
    { label: company.latest_year ? `${company.latest_year}` : 'Y1', suffix: '_y1' },
    { label: company.latest_year ? `${company.latest_year - 1}` : 'Y2', suffix: '_y2' },
    { label: company.latest_year ? `${company.latest_year - 2}` : 'Y3', suffix: '_y3' },
    { label: company.latest_year ? `${company.latest_year - 3}` : 'Y4', suffix: '_y4' },
  ]

  const financialRows = [
    { label: 'Revenue', field: 'revenue' },
    { label: 'Gross Margin', field: 'gross_margin' },
    { label: 'Net Result', field: 'net_result' },
    { label: 'Equity', field: 'equity' },
    { label: 'Employees', field: 'employees' },
  ]

  const getFinancialValue = (field: string, suffix: string) => {
    const key = `${field}${suffix}` as keyof Company
    return company[key] as number | null
  }

  const flags = company.investment_flags || []
  const issues = company.verification_issues || []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg"
        style={{
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded"
          style={{ color: '#888888', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          ✕
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-6">
            <div className="flex-1">
              <h2 className="text-lg font-semibold" style={{ color: '#f5f5f5' }}>
                {company.company_name}
              </h2>
              <p className="text-sm mt-1" style={{ color: '#888888' }}>
                {[company.city, company.province, company.country].filter(Boolean).join(', ')}
              </p>
              {company.cw_url && (
                <a
                  href={company.cw_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs mt-1 inline-block"
                  style={{ color: '#d4a843' }}
                >
                  View on CompanyWeb &rarr;
                </a>
              )}
            </div>
            <ScoreBadge score={company.pe_score} size="md" />
          </div>

          {/* Financial table */}
          <div className="mb-6">
            <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: '#555555' }}>
              Financial History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th className="text-left px-2 py-2 text-xs" style={{ color: '#555555' }}></th>
                    {years.map((y) => (
                      <th
                        key={y.suffix}
                        className="text-right px-2 py-2 text-xs font-medium"
                        style={{ color: '#888888' }}
                      >
                        {y.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {financialRows.map((row) => (
                    <tr key={row.field} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-2 py-2 text-xs" style={{ color: '#888888' }}>{row.label}</td>
                      {years.map((y) => {
                        const val = getFinancialValue(row.field, y.suffix)
                        return (
                          <td key={y.suffix} className="text-right px-2 py-2 text-xs" style={{ color: '#f5f5f5' }}>
                            {row.field === 'employees' ? formatEmployees(val) : formatEuro(val)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PE Score breakdown */}
          <div className="mb-6">
            <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: '#555555' }}>
              PE Score Breakdown
            </h3>
            <ScoreBar label="Revenue Fit" value={company.score_revenue_fit} max={25} />
            <ScoreBar label="Financial Health" value={company.score_financial_health} max={25} />
            <ScoreBar label="Growth Quality" value={company.score_growth_quality} max={25} />
            <ScoreBar label="Operational Fit" value={company.score_operational_fit} max={25} />
          </div>

          {/* Flags */}
          {flags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: '#555555' }}>
                Investment Flags
              </h3>
              <div className="flex flex-wrap gap-2">
                {flags.map((flag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      background: 'rgba(212,168,67,0.12)',
                      color: '#d4a843',
                      border: '1px solid rgba(212,168,67,0.2)',
                    }}
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Analyst summary */}
          {company.analyst_summary && (
            <div className="mb-6">
              <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: '#555555' }}>
                Analyst Summary
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
                {company.analyst_summary}
              </p>
            </div>
          )}

          {/* Verification issues */}
          {issues.length > 0 && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: '#f87171' }}>
                Verification Issues
              </h3>
              <ul className="space-y-1">
                {issues.map((issue, i) => (
                  <li key={i} className="text-xs" style={{ color: '#f87171' }}>
                    &bull; {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
