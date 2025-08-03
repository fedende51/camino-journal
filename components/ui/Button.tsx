'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'camino'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    ...props
  }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
          'disabled:pointer-events-none disabled:opacity-50',
          'relative overflow-hidden',
          
          // Variant styles
          {
            // Primary - Use standard blue for now
            'bg-blue-500 text-white shadow-sm hover:bg-blue-600 active:bg-blue-700 focus:ring-blue-500': 
              variant === 'primary',
            
            // Secondary - Light background  
            'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 active:bg-gray-300 focus:ring-gray-500': 
              variant === 'secondary',
            
            // Ghost - Transparent
            'bg-transparent text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus:ring-gray-500': 
              variant === 'ghost',
            
            // Camino - Warm orange theme (use standard orange)
            'bg-orange-500 text-white shadow-sm hover:bg-orange-600 active:bg-orange-700 focus:ring-orange-500': 
              variant === 'camino',
          },
          
          // Size styles
          {
            'px-3 py-2 text-sm rounded-md': size === 'sm',
            'px-4 py-3 text-base rounded-lg': size === 'md',
            'px-6 py-4 text-base rounded-lg': size === 'lg', 
            'px-8 py-5 text-lg rounded-xl': size === 'xl',
          },
          
          // Full width
          {
            'w-full': fullWidth,
          },
          
          // Loading state
          {
            'cursor-wait': loading,
          },
          
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
        
        {/* Content - hidden when loading */}
        <div className={cn('flex items-center gap-2', loading && 'invisible')}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </div>
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }