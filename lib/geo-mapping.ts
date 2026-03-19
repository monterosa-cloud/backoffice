import { cityToProvince } from './city-to-province'

// Maps GeoJSON NAME_2 values (no spaces/hyphens) to canonical province names
// These canonical names must match what company data uses (province field)
const GEO_NAME_MAP: Record<string, string> = {
  // Belgium GeoJSON NAME_2 → canonical
  "Bruxelles": "Brussels",
  "BrabantWallon": "Brabant wallon",
  "VlaamsBrabant": "Vlaams-Brabant",
  "OostVlaanderen": "Oost-Vlaanderen",
  "WestVlaanderen": "West-Vlaanderen",
  "Antwerpen": "Antwerpen",
  "Hainaut": "Hainaut",
  "Liège": "Liège",
  "Namur": "Namur",
  "Luxembourg": "Luxembourg",
  "Limburg": "Limburg",
  // Alternate forms from company data
  "Brussel": "Brussels",
  "Région de Bruxelles-Capitale": "Brussels",
  "Wallonia": "Hainaut",
  "Wallonie": "Hainaut",
}

export function normalizeGeoName(name: string): string {
  return GEO_NAME_MAP[name] || name
}

export const BELGIUM_PROVINCE_MAP: Record<string, string> = {
  "Hainaut": "Hainaut",
  "Liège": "Liège",
  "Namur": "Namur",
  "Luxembourg": "Luxembourg",
  "Brabant wallon": "Brabant wallon",
  "Antwerpen": "Antwerpen",
  "Oost-Vlaanderen": "Oost-Vlaanderen",
  "West-Vlaanderen": "West-Vlaanderen",
  "Vlaams-Brabant": "Vlaams-Brabant",
  "Limburg": "Limburg",
  "Brussels": "Brussels",
  "Bruxelles": "Brussels",
  "Brussel": "Brussels",
  "Région de Bruxelles-Capitale": "Brussels",
}

export function normalizeProvince(name: string): string {
  return BELGIUM_PROVINCE_MAP[name] || name
}

/**
 * Resolve a company to its canonical province/region name.
 * 1. If company.province maps to a known province → use it
 * 2. Else if company.city exists → look up city-to-province → use that
 * 3. Else → "Unknown"
 */
export function resolveCompanyRegion(
  province: string | null | undefined,
  city: string | null | undefined,
  country: string,
): string {
  // Step 1: try the province field
  if (province) {
    const mapped = BELGIUM_PROVINCE_MAP[province] ?? GEO_NAME_MAP[province]
    if (mapped) return mapped
  }

  // Step 2: try the city → province lookup
  if (city) {
    const fromCity = cityToProvince(city, country)
    if (fromCity) return fromCity
  }

  return 'Unknown'
}

export function getRegionColor(count: number): string {
  if (count === 0) return '#1a1a1a'
  if (count <= 5) return '#1e3a2f'
  if (count <= 15) return '#166534'
  return '#4ade80'
}

export function getScoreColor(avgScore: number | null): string {
  if (avgScore === null) return '#1a1a1a'
  if (avgScore >= 55) return '#166534'
  if (avgScore >= 35) return '#78350f'
  return '#7f1d1d'
}
