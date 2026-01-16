'use client'

import { clsx } from 'clsx'
import { SparklineChart } from './SparklineChart'

interface MetricCardProps {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  sparklineData?: number[]
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error'
}

export function MetricCard({
  label,
  value,
  change,
  changeLabel = 'vs last period',
  sparklineData,
  icon,
  variant = 'default',
}: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0
  const changeColor = isPositive ? 'text-success-400' : 'text-error-400'

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
              {icon}
            </div>
          )}
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="metric-value text-2xl font-semibold text-gray-100 tabular-nums">
            {value}
          </div>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <span className={clsx('text-xs font-medium tabular-nums', changeColor)}>
                {isPositive ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-gray-600">{changeLabel}</span>
            </div>
          )}
        </div>

        {sparklineData && sparklineData.length > 0 && (
          <div className="w-24 h-10">
            <SparklineChart
              data={sparklineData}
              color={variant === 'success' ? '#22c55e' : variant === 'error' ? '#ef4444' : '#3b82f6'}
            />
          </div>
        )}
      </div>
    </div>
  )
}
