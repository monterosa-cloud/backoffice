'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Company, Upload } from '@/lib/types'

interface CompanyContextType {
  companies: Company[]
  uploads: Upload[]
  addCompaniesFromUpload: (upload: Upload, companies: Company[]) => void
  updateCompany: (id: string, updates: Partial<Company>) => void
  loading: boolean
}

const CompanyContext = createContext<CompanyContextType>({
  companies: [],
  uploads: [],
  addCompaniesFromUpload: () => {},
  updateCompany: () => {},
  loading: true,
})

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const { data: uploadsData, error: uploadsError } = await supabase
          .from('uploads')
          .select('*')
          .order('created_at', { ascending: false })

        if (!uploadsError && uploadsData) {
          setUploads(uploadsData)
        }

        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .order('created_at', { ascending: false })

        if (!companiesError && companiesData) {
          setCompanies(companiesData)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const addCompaniesFromUpload = useCallback((upload: Upload, newCompanies: Company[]) => {
    setUploads((prev) => [upload, ...prev])
    setCompanies((prev) => [...newCompanies, ...prev])
  }, [])

  const updateCompany = useCallback((id: string, updates: Partial<Company>) => {
    setCompanies((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c))
  }, [])

  return (
    <CompanyContext.Provider value={{ companies, uploads, addCompaniesFromUpload, updateCompany, loading }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompanies() {
  return useContext(CompanyContext)
}
