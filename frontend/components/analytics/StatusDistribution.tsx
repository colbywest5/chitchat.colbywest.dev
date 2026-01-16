'use client'

import { clsx } from 'clsx'

interface StatusData {
  status: string
  count: number
  color: string
}

interface StatusDistributionProps {
  data: StatusData[]
  title?: string
}

export function StatusDistribution({ data, title = 'Status Distribution' }: StatusDistributionProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-medium text-gray-200 mb-4">{title}</h3>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-gray-800 overflow-hidden flex mb-4">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0
          return (
            <div
              key={item.status}
              className="h-full transition-all duration-300"
              style={{
                width: `${percentage}%`,
                backgroundColor: item.color,
              }}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        {data.map((item) => {
          const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0'
          return (
            <div key={item.status} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-400">{item.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-200 tabular-nums">
                  {item.count}
                </span>
                <span className="text-xs text-gray-600 tabular-nums">
                  ({percentage}%)
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
