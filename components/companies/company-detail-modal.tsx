'use client'

import { useEffect, useCallback, useState } from 'react'
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

function normalizeUrl(url: string): string {
  if (!/^https?:\/\//i.test(url)) return `https://${url}`
  return url
}

function truncateUrl(url: string, max = 40): string {
  const short = url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')
  return short.length > max ? short.slice(0, max) + '…' : short
}

function ContactRow({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-sm w-5 text-center">{icon}</span>
      <span className="text-xs w-28 shrink-0" style={{ color: '#888888' }}>{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs truncate" style={{ color: '#d4a843' }}>
          {value}
        </a>
      ) : (
        <span className="text-xs truncate" style={{ color: '#f5f5f5' }}>{value}</span>
      )}
    </div>
  )
}

export function CompanyDetailModal({ company, onClose }: CompanyDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'financials' | 'contact'>('financials')

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

          {/* Flags */}
          {flags.length > 0 && (
            <div className="mb-4">
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

          {/* Tab Navigation */}
          <div className="flex gap-0 mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setActiveTab('financials')}
              className="px-4 py-2 text-xs font-medium transition-colors"
              style={{
                color: activeTab === 'financials' ? '#f5f5f5' : '#555555',
                borderBottom: activeTab === 'financials' ? '2px solid #1F49F4' : '2px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Financials
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className="px-4 py-2 text-xs font-medium transition-colors"
              style={{
                color: activeTab === 'contact' ? '#f5f5f5' : '#555555',
                borderBottom: activeTab === 'contact' ? '2px solid #1F49F4' : '2px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Contact & Digital
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'financials' && (
            <>
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
            </>
          )}

          {activeTab === 'contact' && (
            <>
              {/* Contact & Digital Presence */}
              <div className="mb-6">
                {(() => {
                  const gerant = company.bnb_gerant_name || company.founder_name || null
                  const email = company.founder_email || null
                  const website = company.website_url || company.website || null
                  const liFounder = company.linkedin_founder_url || null
                  const liCompany = company.linkedin_company_url || null
                  const ig = company.instagram_url || null
                  const fb = company.facebook_url || null
                  const score = company.digital_presence_score
                  const channel = company.preferred_outreach_channel
                  const notes = company.digital_notes
                  const hasAny = gerant || email || website || liFounder || liCompany || ig || fb

                  if (!hasAny) {
                    return (
                      <p className="text-xs" style={{ color: '#555555' }}>
                        No contact or digital presence data available for this company.
                      </p>
                    )
                  }

                  return (
                    <div>
                      {gerant && <ContactRow icon="👤" label="Gérant" value={gerant} />}
                      {email && <ContactRow icon="✉" label="Email" value={email} href={`mailto:${email}`} />}
                      {website && (
                        <ContactRow icon="🌐" label="Website" value={truncateUrl(website)} href={normalizeUrl(website)} />
                      )}
                      {liFounder && (
                        <ContactRow icon="in" label="LinkedIn (person)" value={truncateUrl(liFounder)} href={normalizeUrl(liFounder)} />
                      )}
                      {liCompany && (
                        <ContactRow icon="in" label="LinkedIn (company)" value={truncateUrl(liCompany)} href={normalizeUrl(liCompany)} />
                      )}
                      {ig && (
                        <ContactRow icon="📷" label="Instagram" value={truncateUrl(ig)} href={normalizeUrl(ig)} />
                      )}
                      {fb && (
                        <ContactRow icon="f" label="Facebook" value={truncateUrl(fb)} href={normalizeUrl(fb)} />
                      )}

                      {/* Digital presence footer */}
                      {(score !== null || channel || company.website_modernity) && (
                        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          {score !== null && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{
                              background: score >= 6 ? 'rgba(74,222,128,0.12)' : score >= 3 ? 'rgba(251,146,60,0.12)' : 'rgba(248,113,113,0.12)',
                              color: score >= 6 ? '#4ade80' : score >= 3 ? '#fb923c' : '#f87171',
                            }}>
                              Digital Score: {score}/10
                            </span>
                          )}
                          {channel && (
                            <span className="px-2 py-0.5 rounded text-[10px]" style={{ background: 'rgba(31,73,244,0.12)', color: '#6b8aff' }}>
                              {channel}
                            </span>
                          )}
                          {company.website_modernity && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{
                              background: company.website_modernity === 'modern' ? 'rgba(74,222,128,0.12)' : company.website_modernity === 'dated' ? 'rgba(251,146,60,0.12)' : 'rgba(248,113,113,0.12)',
                              color: company.website_modernity === 'modern' ? '#4ade80' : company.website_modernity === 'dated' ? '#fb923c' : '#f87171',
                            }}>
                              {company.website_modernity === 'modern' ? 'Modern Site' : company.website_modernity === 'dated' ? 'Dated Site' : 'Old Site'}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Services */}
                      {(company.has_maintenance === true || company.has_emergency === true) && (
                        <div className="flex items-center gap-3 mt-3">
                          {company.has_maintenance === true && (
                            <span className="text-xs" style={{ color: '#4ade80' }}>Maintenance</span>
                          )}
                          {company.has_emergency === true && (
                            <span className="text-xs" style={{ color: '#4ade80' }}>24h Emergency</span>
                          )}
                        </div>
                      )}

                      {/* AI Notes */}
                      {notes && (
                        <p className="text-xs mt-3 italic" style={{ color: '#888888' }}>
                          {notes}
                        </p>
                      )}
                    </div>
                  )
                })()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
