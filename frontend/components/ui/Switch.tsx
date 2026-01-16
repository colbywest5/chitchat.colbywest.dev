'use client'

import { forwardRef, useId } from 'react'
import { clsx } from 'clsx'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  className?: string
  id?: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, id, checked, onChange, disabled = false }, ref) => {
    const generatedId = useId()
    const switchId = id || generatedId

    return (
      <label
        htmlFor={switchId}
        className={clsx(
          'flex items-center justify-between gap-3 cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {(label || description) && (
          <div className="flex-1">
            {label && <div className="text-sm font-medium text-gray-200">{label}</div>}
            {description && (
              <div className="text-xs text-gray-500">{description}</div>
            )}
          </div>
        )}
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
          />
          <div
            className={clsx(
              'w-10 h-6 rounded-full transition-colors duration-200',
              'bg-gray-700 peer-checked:bg-accent-500',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-accent-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-gray-950'
            )}
          />
          <div
            className={clsx(
              'absolute top-1 left-1 w-4 h-4 rounded-full bg-white',
              'transition-transform duration-200',
              'peer-checked:translate-x-4'
            )}
          />
        </div>
      </label>
    )
  }
)

Switch.displayName = 'Switch'
