'use client'

import { forwardRef, ImgHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'busy' | 'away'
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-accent-500',
    'bg-success-500',
    'bg-warning-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-cyan-500',
    'bg-teal-500',
  ]
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, name = '', size = 'md', status, alt, ...props }, ref) => {
    const sizeStyles = {
      xs: 'w-6 h-6 text-2xs',
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-16 h-16 text-lg',
    }

    const statusSizeStyles = {
      xs: 'w-1.5 h-1.5 border',
      sm: 'w-2 h-2 border',
      md: 'w-2.5 h-2.5 border-2',
      lg: 'w-3 h-3 border-2',
      xl: 'w-4 h-4 border-2',
    }

    const statusColors = {
      online: 'bg-success-500',
      offline: 'bg-gray-500',
      busy: 'bg-error-500',
      away: 'bg-warning-500',
    }

    return (
      <div ref={ref} className={clsx('relative inline-block', className)}>
        {src ? (
          <img
            src={src}
            alt={alt || name}
            className={clsx(
              'rounded-full object-cover',
              sizeStyles[size]
            )}
            {...props}
          />
        ) : (
          <div
            className={clsx(
              'rounded-full flex items-center justify-center font-medium text-white',
              sizeStyles[size],
              getColorFromName(name)
            )}
            role="img"
            aria-label={alt || name}
          >
            {getInitials(name)}
          </div>
        )}
        {status && (
          <span
            className={clsx(
              'absolute bottom-0 right-0 rounded-full border-gray-900',
              statusSizeStyles[size],
              statusColors[status]
            )}
            aria-label={status}
          />
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'
