'use client'

import { useState, useMemo, useCallback } from 'react'
import { Company } from '@/lib/types'
import { MapControls } from '@/components/map/map-controls'
import { WorldMap } from '@/components/map/world-map'
import { ProvincePanel } from '@/components/map/province-panel'
import { CompanyDetailModal } from '@/components/companies/company-detail-modal'
import { useCompanies } from '@/lib/company-context'
import { resolveCompanyRegion } from '@/lib/geo-mapping'

export default function MapPage() {
  const { companies: allCompanies } = useCompanies()

  const [activeCountries, setActiveCountries] = useState<string[]>(['Belgium'])
  const [colorMode, setColorMode] = useState<'count' | 'score'>('count')
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'mid' | 'low'>('all')
  const [sectorFilter, setSectorFilter] = useState('All')
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string>('Belgium')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  const handleToggleCountry = useCallback((country: string) => {
    setActiveCountries((prev) => {
      if (prev.includes(country)) {
        if (prev.length === 1) return prev
        return prev.filter((c) => c !== country)
      }
      return [...prev, country]
    })
  }, [])

  const filteredCompanies = useMemo(() => {
    let result = allCompanies.filter((c) => activeCountries.includes(c.country))

    if (scoreFilter === 'high') {
      result = result.filter((c) => c.pe_score !== null && c.pe_score >= 55)
    } else if (scoreFilter === 'mid') {
      result = result.filter((c) => c.pe_score !== null && c.pe_score >= 35 && c.pe_score < 55)
    } else if (scoreFilter === 'low') {
      result = result.filter((c) => c.pe_score !== null && c.pe_score < 35)
    }

    if (sectorFilter !== 'All') {
      result = result.filter((c) => c.sub_sector === sectorFilter)
    }

    return result
  }, [allCompanies, activeCountries, scoreFilter, sectorFilter])

  const companiesByRegion = useMemo(() => {
    const map: Record<string, { count: number; avgScore: number | null }> = {}
    const byRegion: Record<string, Company[]> = {}

    filteredCompanies.forEach((c) => {
      const region = resolveCompanyRegion(c.province, c.city, c.country)
      if (!byRegion[region]) byRegion[region] = []
      byRegion[region].push(c)
    })

    Object.entries(byRegion).forEach(([region, companies]) => {
      const scored = companies.filter((c) => c.pe_score !== null)
      const avgScore =
        scored.length > 0
          ? Math.round(scored.reduce((sum, c) => sum + (c.pe_score || 0), 0) / scored.length)
          : null
      map[region] = { count: companies.length, avgScore }
    })

    return map
  }, [filteredCompanies])

  const regionCompanies = useMemo(() => {
    if (!selectedRegion) return []
    return filteredCompanies.filter((c) => resolveCompanyRegion(c.province, c.city, c.country) === selectedRegion)
  }, [filteredCompanies, selectedRegion])

  const handleRegionClick = useCallback((regionName: string, country: string) => {
    setSelectedRegion(regionName)
    setSelectedCountry(country)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedRegion(null)
  }, [])

  return (
    <div
      className="flex flex-col"
      style={{ marginLeft: -32, marginTop: -32, height: '100vh', overflow: 'hidden' }}
    >
      <MapControls
        activeCountries={activeCountries}
        onToggleCountry={handleToggleCountry}
        colorMode={colorMode}
        onColorModeChange={setColorMode}
        scoreFilter={scoreFilter}
        onScoreFilterChange={setScoreFilter}
        sectorFilter={sectorFilter}
        onSectorFilterChange={setSectorFilter}
      />

      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        <WorldMap
          activeCountries={activeCountries}
          colorMode={colorMode}
          companiesByRegion={companiesByRegion}
          onRegionClick={handleRegionClick}
        />

        <ProvincePanel
          regionName={selectedRegion}
          country={selectedCountry}
          companies={regionCompanies}
          onClose={handleClosePanel}
          onCompanyClick={setSelectedCompany}
        />
      </div>

      <CompanyDetailModal
        company={selectedCompany}
        onClose={() => setSelectedCompany(null)}
      />
    </div>
  )
}
