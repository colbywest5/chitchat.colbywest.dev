'use client'

import { clsx } from 'clsx'
import { ConnectionStatus as Status } from '@/lib/websocket'

interface ConnectionStatusProps {
  status: Status
  showLabel?: boolean
  className?: string
}

export function ConnectionStatus({
  status,
  showLabel = false,
  className,
}: ConnectionStatusProps) {
  const config = {
    connecting: {
      color: 'bg-warning-500',
      pulse: true,
      label: 'Connecting...',
    },
    connected: {
      color: 'bg-success-500',
      pulse: false,
      label: 'Connected',
    },
    disconnected: {
      color: 'bg-gray-500',
      pulse: false,
      label: 'Disconnected',
    },
    error: {
      color: 'bg-error-500',
      pulse: true,
      label: 'Connection Error',
    },
  }

  const { color, pulse, label } = config[status]

  return (
    <div
      className={clsx('flex items-center gap-2', className)}
      role="status"
      aria-live="polite"
    >
      <span
        className={clsx(
          'w-2 h-2 rounded-full',
          color,
          pulse && 'animate-pulse'
        )}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="text-xs text-gray-400">{label}</span>
      )}
      <span className="sr-only">{label}</span>
    </div>
  )
}
