'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { parseExcel, type ParseResult } from '@/lib/excel/parser'
import type { Company } from '@/lib/types'

interface DropzoneProps {
  onUpload: (file: File, companies: Company[], runScoring: boolean) => void;
}

export default function Dropzone({ onUpload }: DropzoneProps) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const f = acceptedFiles[0]
    if (!f) return

    setError(null)
    setParsing(true)
    setParseResult(null)
    setFile(f)

    try {
      const buffer = await f.arrayBuffer()
      const result = parseExcel(buffer)

      if (result.rowCount === 0) {
        setError('No valid rows found in the file. Check that "Company Name" column exists.')
        setParsing(false)
        return
      }

      setParseResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
    } finally {
      setParsing(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  const handleReset = () => {
    setParseResult(null)
    setFile(null)
    setError(null)
  }

  const handleUpload = async (runScoring: boolean) => {
    if (!file || !parseResult) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('companies', JSON.stringify(parseResult.fullCompanies))

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        setError(error.error || 'Upload failed')
        setUploading(false)
        return
      }

      const result = await response.json()
      onUpload(file, result.companies || parseResult.fullCompanies, runScoring)
      handleReset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {!parseResult && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive
              ? 'border-[#d4a843] bg-[#d4a843]/5'
              : 'border-white/[0.08] hover:border-white/20 bg-[#111111]'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <svg className="w-10 h-10 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <p className="text-sm text-[#f5f5f5]">
                {isDragActive ? 'Drop file here' : 'Drop .xlsx file here'}
              </p>
              <p className="text-xs text-[#888888] mt-1">or click to browse (max 10MB)</p>
            </div>
          </div>
        </div>
      )}

      {(parsing || uploading) && (
        <div className="bg-[#111111] rounded-lg border border-white/[0.08] p-6 text-center">
          <div className="animate-spin w-8 h-8 border-[3px] border-[#888888] border-t-[#d4a843] rounded-full mx-auto" />
          <p className="text-sm text-[#888888] mt-3">{uploading ? 'Uploading companies...' : 'Parsing file...'}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={handleReset} className="text-xs text-[#888888] hover:text-[#f5f5f5] mt-2 underline">
            Try again
          </button>
        </div>
      )}

      {parseResult && !uploading && (
        <div className="space-y-4">
          <div className="bg-[#111111] rounded-lg border border-white/[0.08] p-4">
            <h3 className="text-sm font-medium text-[#f5f5f5] mb-3">Column validation</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {parseResult.columns.map((col) => (
                <div key={col.name} className="flex items-center gap-2 text-xs">
                  <span className={col.found ? 'text-green-400' : 'text-orange-400'}>
                    {col.found ? '\u2713' : '\u26A0'}
                  </span>
                  <span className={col.found ? 'text-[#f5f5f5]' : 'text-[#888888]'}>
                    {col.name}
                    {col.required && <span className="text-red-400 ml-0.5">*</span>}
                  </span>
                  <span className="text-[#888888] ml-auto">{col.coverage}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg border border-white/[0.08] p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#f5f5f5]">{file?.name}</p>
                <p className="text-xs text-[#888888] mt-0.5">
                  Sheet: {parseResult.sheetName} &middot; {parseResult.rowCount} companies &middot;{' '}
                  {parseResult.columns.filter(c => c.found).length}/{parseResult.columns.length} columns matched
                </p>
              </div>
              <button onClick={handleReset} className="text-xs text-[#888888] hover:text-[#f5f5f5]">
                Remove
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleUpload(true)}
                className="bg-[#d4a843] hover:bg-[#c49a3a] text-black text-sm font-medium px-4 py-2 rounded-md transition-colors duration-150"
              >
                Upload &amp; Run PE Scoring
              </button>
              <button
                onClick={() => handleUpload(false)}
                className="border border-white/[0.08] hover:border-white/20 text-[#f5f5f5] text-sm px-4 py-2 rounded-md transition-colors duration-150"
              >
                Upload only
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
