'use client'

import { clsx } from 'clsx'

export interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }

  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-800',
        variantStyles[variant],
        className
      )}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height
          ? typeof height === 'number'
            ? `${height}px`
            : height
          : undefined,
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" />
          <Skeleton width="40%" className="h-3" />
        </div>
      </div>
      <Skeleton height={60} variant="rectangular" />
      <div className="flex gap-2">
        <Skeleton width={60} height={24} variant="rectangular" />
        <Skeleton width={60} height={24} variant="rectangular" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 px-4 py-2">
        <Skeleton width="20%" />
        <Skeleton width="30%" />
        <Skeleton width="25%" />
        <Skeleton width="25%" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 bg-gray-900/50 rounded-lg">
          <Skeleton width="20%" className="h-5" />
          <Skeleton width="30%" className="h-5" />
          <Skeleton width="25%" className="h-5" />
          <Skeleton width="25%" className="h-5" />
        </div>
      ))}
    </div>
  )
}
