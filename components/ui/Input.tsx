'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    fullWidth = false,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        
        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </div>
          )}
          
          {/* Input field */}
          <input
            id={inputId}
            type={type}
            className={cn(
              // Base styles
              'block w-full rounded-lg border bg-white px-4 py-3 text-base placeholder:text-neutral-400',
              'transition-all duration-200 ease-out',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              
              // State styles
              {
                // Default state
                'border-neutral-200 hover:border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20': 
                  !error,
                
                // Error state
                'border-error-500 hover:border-error-600 focus:border-error-500 focus:ring-error-500/20': 
                  error,
                
                // With left icon
                'pl-10': leftIcon,
                
                // With right icon
                'pr-10': rightIcon,
              },
              
              className
            )}
            ref={ref}
            {...props}
          />
          
          {/* Right icon */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {/* Helper text or error */}
        {(helperText || error) && (
          <p className={cn(
            'text-xs',
            error ? 'text-error-600' : 'text-neutral-500'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }