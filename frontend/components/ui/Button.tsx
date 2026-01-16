'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { Spinner } from './Spinner'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      iconPosition = 'left',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    const baseStyles = clsx(
      'inline-flex items-center justify-center gap-2 font-medium',
      'rounded-lg transition-all duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    )

    const variantStyles = {
      primary: clsx(
        'bg-accent-500 text-white',
        'hover:bg-accent-600 active:bg-accent-700',
        'focus-visible:ring-accent-500'
      ),
      secondary: clsx(
        'bg-gray-800 text-gray-100 border border-gray-700',
        'hover:bg-gray-750 hover:border-gray-600 active:bg-gray-700',
        'focus-visible:ring-gray-500'
      ),
      ghost: clsx(
        'text-gray-300',
        'hover:bg-gray-800/50 active:bg-gray-800',
        'focus-visible:ring-gray-500'
      ),
      danger: clsx(
        'bg-error-500 text-white',
        'hover:bg-error-600 active:bg-error-600',
        'focus-visible:ring-error-500'
      ),
      success: clsx(
        'bg-success-500 text-white',
        'hover:bg-success-600 active:bg-success-600',
        'focus-visible:ring-success-500'
      ),
    }

    const sizeStyles = {
      xs: 'h-7 px-2.5 text-xs',
      sm: 'h-8 px-3 text-sm',
      md: 'h-9 px-4 text-sm',
      lg: 'h-10 px-5 text-base',
    }

    const iconSizeStyles = {
      xs: 'w-3.5 h-3.5',
      sm: 'w-4 h-4',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    }

    return (
      <button
        ref={ref}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <Spinner size={size === 'lg' ? 'sm' : 'xs'} />
        ) : (
          icon &&
          iconPosition === 'left' && (
            <span className={iconSizeStyles[size]}>{icon}</span>
          )
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span className={iconSizeStyles[size]}>{icon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
