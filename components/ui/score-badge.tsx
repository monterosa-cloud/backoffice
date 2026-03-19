'use client'

interface ScoreBadgeProps {
  score: number | null
  size?: 'sm' | 'md'
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'

  if (score === null || score === undefined) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full font-medium bg-zinc-900 text-zinc-500 border border-zinc-800 ${sizeClasses}`}
      >
        &mdash;
      </span>
    )
  }

  let colorClasses: string
  if (score >= 55) {
    colorClasses = 'bg-green-950 text-green-400 border border-green-800'
  } else if (score >= 35) {
    colorClasses = 'bg-orange-950 text-orange-400 border border-orange-800'
  } else {
    colorClasses = 'bg-red-950 text-red-400 border border-red-800'
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium ${colorClasses} ${sizeClasses}`}
    >
      {score}
    </span>
  )
}
