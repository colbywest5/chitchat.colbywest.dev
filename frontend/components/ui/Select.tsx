'use client'

import { useState, useRef, useEffect, forwardRef } from 'react'
import { clsx } from 'clsx'

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

export interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  className?: string
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select an option',
      label,
      error,
      disabled,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find((opt) => opt.value === value)

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false)
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }, [isOpen])

    const handleSelect = (option: SelectOption) => {
      if (option.disabled) return
      onChange?.(option.value)
      setIsOpen(false)
    }

    return (
      <div ref={ref} className={clsx('field-group', className)}>
        {label && <label className="field-label">{label}</label>}
        <div ref={containerRef} className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={clsx(
              'w-full h-9 px-3 flex items-center justify-between gap-2',
              'bg-gray-800 border border-gray-700 rounded-lg text-sm',
              'transition-colors duration-150',
              'hover:border-gray-600',
              'focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
              isOpen && 'border-accent-500 ring-1 ring-accent-500'
            )}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span
              className={clsx(
                'truncate',
                selectedOption ? 'text-gray-100' : 'text-gray-500'
              )}
            >
              {selectedOption?.label || placeholder}
            </span>
            <svg
              className={clsx(
                'w-4 h-4 text-gray-400 transition-transform duration-150',
                isOpen && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {isOpen && (
            <div
              className={clsx(
                'absolute z-50 w-full mt-1 py-1',
                'bg-gray-900 border border-gray-800 rounded-lg shadow-xl',
                'animate-fade-in max-h-60 overflow-auto'
              )}
              role="listbox"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  disabled={option.disabled}
                  className={clsx(
                    'w-full px-3 py-2 text-left text-sm',
                    'transition-colors duration-100',
                    option.disabled && 'opacity-50 cursor-not-allowed',
                    option.value === value
                      ? 'bg-accent-500/10 text-accent-400'
                      : 'text-gray-300 hover:bg-gray-800'
                  )}
                  role="option"
                  aria-selected={option.value === value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {error && <p className="field-error">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
