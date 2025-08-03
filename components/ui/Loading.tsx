'use client'

import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'neutral' | 'white'
}

const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({
    className,
    size = 'md',
    color = 'primary',
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'animate-spin rounded-full border-2',
          
          // Size styles
          {
            'h-4 w-4 border-[1.5px]': size === 'sm',
            'h-6 w-6 border-2': size === 'md',
            'h-8 w-8 border-2': size === 'lg',
          },
          
          // Color styles
          {
            'border-primary-200 border-t-primary-500': color === 'primary',
            'border-neutral-200 border-t-neutral-500': color === 'neutral',
            'border-white/20 border-t-white': color === 'white',
          },
          
          className
        )}
        {...props}
      />
    )
  }
)
LoadingSpinner.displayName = 'LoadingSpinner'

// Skeleton loader for content placeholders
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  variant?: 'text' | 'rectangular' | 'circular'
  lines?: number
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({
    className,
    width,
    height,
    variant = 'text',
    lines = 1,
    style,
    ...props
  }, ref) => {
    if (variant === 'text' && lines > 1) {
      return (
        <div className="space-y-2">
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className={cn(
                'animate-pulse bg-neutral-200 rounded h-4',
                i === lines - 1 && 'w-3/4', // Last line is shorter
                className
              )}
              style={{
                width: i === lines - 1 ? '75%' : width,
                ...style
              }}
            />
          ))}
        </div>
      )
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse bg-neutral-200',
          
          // Variant styles
          {
            'rounded h-4': variant === 'text',
            'rounded': variant === 'rectangular', 
            'rounded-full': variant === 'circular',
          },
          
          className
        )}
        style={{
          width,
          height,
          ...style
        }}
        {...props}
      />
    )
  }
)
Skeleton.displayName = 'Skeleton'

// Loading overlay for entire sections
export interface LoadingOverlayProps extends HTMLAttributes<HTMLDivElement> {
  loading: boolean
  text?: string
  backdrop?: boolean
}

const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({
    className,
    loading,
    text = 'Loading...',
    backdrop = true,
    children,
    ...props
  }, ref) => {
    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        {children}
        
        {loading && (
          <div className={cn(
            'absolute inset-0 flex flex-col items-center justify-center gap-3 z-overlay',
            backdrop && 'bg-white/80 backdrop-blur-sm'
          )}>
            <LoadingSpinner size="lg" />
            <p className="text-body text-neutral-600 font-medium">{text}</p>
          </div>
        )}
      </div>
    )
  }
)
LoadingOverlay.displayName = 'LoadingOverlay'

export { LoadingSpinner, Skeleton, LoadingOverlay }