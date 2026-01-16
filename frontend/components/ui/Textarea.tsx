'use client'

import { forwardRef, TextareaHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="field-group">
        {label && (
          <label htmlFor={textareaId} className="field-label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={clsx(
            'w-full min-h-[80px] px-3 py-2 rounded-lg text-sm',
            'bg-gray-800 border border-gray-700 text-gray-100',
            'placeholder:text-gray-500',
            'transition-colors duration-150',
            'hover:border-gray-600',
            'focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'resize-y',
            error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="field-error" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="field-description">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
