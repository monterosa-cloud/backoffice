'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Company, Upload } from '@/lib/types'

interface CompanyContextType {
  companies: Company[]
  uploads: Upload[]
  addCompaniesFromUpload: (upload: Upload, companies: Company[]) => void
}

const CompanyContext = createContext<CompanyContextType>({
  companies: [],
  uploads: [],
  addCompaniesFromUpload: () => {},
})

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>(() => loadFromStorage('pe_companies', []))
  const [uploads, setUploads] = useState<Upload[]>(() => loadFromStorage('pe_uploads', []))

  useEffect(() => {
    localStorage.setItem('pe_companies', JSON.stringify(companies))
  }, [companies])

  useEffect(() => {
    localStorage.setItem('pe_uploads', JSON.stringify(uploads))
  }, [uploads])

  const addCompaniesFromUpload = useCallback((upload: Upload, newCompanies: Company[]) => {
    setUploads((prev) => [upload, ...prev])
    setCompanies((prev) => {
      const existing = new Map(prev.map((c) => [`${c.company_name}|${c.country}`, c]))
      newCompanies.forEach((c) => {
        existing.set(`${c.company_name}|${c.country}`, c)
      })
      return Array.from(existing.values())
    })
  }, [])

  return (
    <CompanyContext.Provider value={{ companies, uploads, addCompaniesFromUpload }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompanies() {
  return useContext(CompanyContext)
}
