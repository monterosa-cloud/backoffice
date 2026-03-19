'use client'

interface MapControlsProps {
  activeCountries: string[]
  onToggleCountry: (country: string) => void
  colorMode: 'count' | 'score'
  onColorModeChange: (mode: 'count' | 'score') => void
  scoreFilter: 'all' | 'high' | 'mid' | 'low'
  onScoreFilterChange: (filter: 'all' | 'high' | 'mid' | 'low') => void
  sectorFilter: string
  onSectorFilterChange: (sector: string) => void
}

export function MapControls({
  activeCountries,
  onToggleCountry,
  colorMode,
  onColorModeChange,
  scoreFilter,
  onScoreFilterChange,
  sectorFilter,
  onSectorFilterChange,
}: MapControlsProps) {
  const countries = ['Belgium', 'France', 'Italy']
  const scoreOptions: { value: 'all' | 'high' | 'mid' | 'low'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'high', label: '≥55' },
    { value: 'mid', label: '35–54' },
    { value: 'low', label: '<35' },
  ]
  const sectors = ['All', 'HVAC', 'Electrical', 'Fire Safety', 'Multi-trade']

  const pillStyle = (active: boolean) => ({
    padding: '5px 12px',
    borderRadius: 9999,
    fontSize: 12,
    fontWeight: 500 as const,
    cursor: 'pointer' as const,
    border: active ? '1px solid rgba(212,168,67,0.3)' : '1px solid rgba(255,255,255,0.08)',
    background: active ? 'rgba(212,168,67,0.12)' : 'transparent',
    color: active ? '#d4a843' : '#888888',
    transition: 'all 0.15s',
  })

  return (
    <div
      className="flex items-center gap-6 flex-wrap"
      style={{
        padding: '12px 20px',
        background: '#111111',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Country toggles */}
      <div className="flex items-center gap-2">
        <span className="text-xs mr-1" style={{ color: '#555555' }}>Country</span>
        {countries.map((c) => (
          <button
            key={c}
            onClick={() => onToggleCountry(c)}
            style={pillStyle(activeCountries.includes(c))}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />

      {/* Color mode */}
      <div className="flex items-center gap-2">
        <span className="text-xs mr-1" style={{ color: '#555555' }}>Color by</span>
        <button onClick={() => onColorModeChange('count')} style={pillStyle(colorMode === 'count')}>
          By count
        </button>
        <button onClick={() => onColorModeChange('score')} style={pillStyle(colorMode === 'score')}>
          By avg score
        </button>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />

      {/* Score filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs mr-1" style={{ color: '#555555' }}>Score</span>
        {scoreOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onScoreFilterChange(opt.value)}
            style={pillStyle(scoreFilter === opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />

      {/* Sector dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-xs mr-1" style={{ color: '#555555' }}>Sector</span>
        <select
          value={sectorFilter}
          onChange={(e) => onSectorFilterChange(e.target.value)}
          className="text-xs rounded px-2 py-1.5"
          style={{
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#f5f5f5',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
