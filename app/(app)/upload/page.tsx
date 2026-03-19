'use client'

import Dropzone from '@/components/upload/dropzone'
import UploadHistory from '@/components/upload/upload-history'
import type { Upload, Company } from '@/lib/types'
import { useCompanies } from '@/lib/company-context'

export default function UploadPage() {
  const { uploads, addCompaniesFromUpload } = useCompanies()

  const handleUpload = (file: File, fullCompanies: Company[], runScoring: boolean) => {
    const newUpload: Upload = {
      id: crypto.randomUUID(),
      user_id: '',
      filename: file.name,
      storage_path: '',
      row_count: fullCompanies.length,
      status: runScoring ? 'processing' : 'done',
      error_msg: null,
      created_at: new Date().toISOString(),
      completed_at: runScoring ? null : new Date().toISOString(),
    }

    addCompaniesFromUpload(newUpload, fullCompanies)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-[#f5f5f5]">Upload &amp; Score</h1>
          <p className="text-sm text-[#888888] mt-1">
            Upload company data for PE scoring
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Dropzone onUpload={handleUpload} />
          </div>
          <div className="lg:col-span-2">
            <h2 className="text-sm font-medium text-[#888888] mb-3">Upload history</h2>
            <UploadHistory uploads={uploads} />
          </div>
        </div>
      </div>
    </div>
  )
}
