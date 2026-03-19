'use client'

import type { Upload } from '@/lib/types'

interface UploadHistoryProps {
  uploads: Upload[];
}

const statusConfig: Record<Upload['status'], { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-white/[0.06] text-[#888888]',
  },
  processing: {
    label: 'Processing',
    className: 'bg-yellow-500/10 text-yellow-400 animate-pulse',
  },
  done: {
    label: 'Done',
    className: 'bg-green-500/10 text-green-400',
  },
  error: {
    label: 'Error',
    className: 'bg-red-500/10 text-red-400',
  },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function UploadHistory({ uploads }: UploadHistoryProps) {
  if (uploads.length === 0) {
    return (
      <div className="bg-[#111111] rounded-lg border border-white/[0.08] p-8 text-center">
        <p className="text-sm text-[#888888]">No uploads yet</p>
        <p className="text-xs text-[#888888]/60 mt-1">
          Upload an Excel file to get started
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#111111] rounded-lg border border-white/[0.08] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.08]">
            <th className="text-left text-xs font-medium text-[#888888] px-4 py-3">Date</th>
            <th className="text-left text-xs font-medium text-[#888888] px-4 py-3">File</th>
            <th className="text-right text-xs font-medium text-[#888888] px-4 py-3">Rows</th>
            <th className="text-right text-xs font-medium text-[#888888] px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {uploads.map((upload) => {
            const status = statusConfig[upload.status]
            return (
              <tr
                key={upload.id}
                className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3 text-xs text-[#888888] whitespace-nowrap">
                  {formatDate(upload.created_at)}
                </td>
                <td className="px-4 py-3 text-[#f5f5f5] truncate max-w-[160px]">
                  {upload.filename}
                </td>
                <td className="px-4 py-3 text-right text-[#f5f5f5] tabular-nums">
                  {upload.row_count ?? 0}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-md ${status.className}`}>
                    {status.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
