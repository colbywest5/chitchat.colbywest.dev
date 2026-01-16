'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline'
  size?: 'sm' | 'md'
  dot?: boolean
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { className, variant = 'default', size = 'sm', dot = false, children, ...props },
    ref
  ) => {
    const baseStyles = clsx(
      'inline-flex items-center gap-1.5 font-medium rounded-full',
      'whitespace-nowrap'
    )

    const variantStyles = {
      default: 'bg-gray-800 text-gray-300',
      success: 'bg-success-500/15 text-success-500',
      warning: 'bg-warning-500/15 text-warning-500',
      error: 'bg-error-500/15 text-error-500',
      info: 'bg-accent-500/15 text-accent-400',
      outline: 'bg-transparent border border-gray-700 text-gray-300',
    }

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-2xs',
      md: 'px-2.5 py-1 text-xs',
    }

    const dotColors = {
      default: 'bg-gray-400',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      error: 'bg-error-500',
      info: 'bg-accent-500',
      outline: 'bg-gray-400',
    }

    return (
      <span
        ref={ref}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
