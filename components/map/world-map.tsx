'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps'
import { getRegionColor, getScoreColor, normalizeGeoName } from '@/lib/geo-mapping'

interface RegionData {
  count: number
  avgScore: number | null
}

interface WorldMapProps {
  activeCountries: string[]
  colorMode: 'count' | 'score'
  companiesByRegion: Record<string, RegionData>
  onRegionClick: (regionName: string, country: string) => void
}

interface TooltipState {
  x: number
  y: number
  name: string
  count: number
  avgScore: number | null
}

const GEO_URLS: Record<string, string> = {
  Belgium: '/geo/belgium-provinces.geojson',
  France: '/geo/france-departements.geojson',
  Italy: '/geo/italy-regions.geojson',
}

interface GeoFeature {
  type: string
  properties: Record<string, string | number>
  geometry: {
    type: string
    coordinates: number[][][]
  }
}

interface GeoJSON {
  type: string
  features: GeoFeature[]
}

function WorldMapInner({
  activeCountries,
  colorMode,
  companiesByRegion,
  onRegionClick,
}: WorldMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [geoData, setGeoData] = useState<Record<string, GeoJSON>>({})

  useEffect(() => {
    activeCountries.forEach((country) => {
      const url = GEO_URLS[country]
      if (!url || geoData[country]) return
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to load ${url}`)
          return res.json()
        })
        .then((data) => {
          setGeoData((prev) => ({ ...prev, [country]: data }))
        })
        .catch(() => {
          // GeoJSON not available yet — use empty features
          setGeoData((prev) => ({
            ...prev,
            [country]: { type: 'FeatureCollection', features: [] },
          }))
        })
    })
  }, [activeCountries, geoData])

  const getRegionName = (geo: GeoFeature): string => {
    const raw =
      (geo.properties.NAME_2 as string) ||
      (geo.properties.name as string) ||
      (geo.properties.NAME as string) ||
      (geo.properties.nom as string) ||
      (geo.properties.reg_name as string) ||
      (geo.properties.NAME_1 as string) ||
      'Unknown'
    return normalizeGeoName(raw)
  }

  const getFillColor = useCallback(
    (regionName: string) => {
      const data = companiesByRegion[regionName]
      if (!data) return '#1a1a1a'
      if (colorMode === 'count') return getRegionColor(data.count)
      return getScoreColor(data.avgScore)
    },
    [colorMode, companiesByRegion]
  )

  const handleMouseMove = useCallback(
    (geo: GeoFeature, event: React.MouseEvent) => {
      const name = getRegionName(geo)
      const data = companiesByRegion[name] || { count: 0, avgScore: null }
      setTooltip({
        x: event.clientX,
        y: event.clientY,
        name,
        count: data.count,
        avgScore: data.avgScore,
      })
    },
    [companiesByRegion]
  )

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  return (
    <div className="relative w-full h-full" style={{ background: '#0a0a0a' }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [4.5, 50.5],
          scale: 5000,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup>
          {activeCountries.map((country) => {
            const geo = geoData[country]
            if (!geo) return null
            return (
              <Geographies key={country} geography={geo}>
                {({ geographies }) =>
                  geographies.map((geoItem) => {
                    const regionName = getRegionName(geoItem as unknown as GeoFeature)
                    return (
                      <Geography
                        key={geoItem.rsmKey}
                        geography={geoItem}
                        fill={getFillColor(regionName)}
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: 'none', transition: 'fill 0.3s' },
                          hover: { outline: 'none', fill: '#d4a843', cursor: 'pointer' },
                          pressed: { outline: 'none' },
                        }}
                        onClick={() => onRegionClick(regionName, country)}
                        onMouseMove={(e) =>
                          handleMouseMove(geoItem as unknown as GeoFeature, e as unknown as React.MouseEvent)
                        }
                        onMouseLeave={handleMouseLeave}
                      />
                    )
                  })
                }
              </Geographies>
            )
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed pointer-events-none z-50 px-3 py-2 rounded text-xs"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#f5f5f5',
          }}
        >
          <div className="font-medium">{tooltip.name}</div>
          <div style={{ color: '#888888' }}>
            {tooltip.count} companies
            {tooltip.avgScore !== null && ` · Avg score: ${tooltip.avgScore}`}
          </div>
        </div>
      )}

      {/* Empty state if no geojson loaded */}
      {activeCountries.length > 0 &&
        activeCountries.every((c) => !geoData[c] || geoData[c].features.length === 0) && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ pointerEvents: 'none' }}
          >
            <div className="text-center">
              <div className="text-sm mb-1" style={{ color: '#555555' }}>
                No GeoJSON data available
              </div>
              <div className="text-xs" style={{ color: '#555555' }}>
                Add province GeoJSON files to /public/geo/
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

export const WorldMap = memo(WorldMapInner)
