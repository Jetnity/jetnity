'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  error?: string
  containerClassName?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      type = 'text',
      label,
      icon,
      error,
      ...props
    },
    ref
  ) => (
    <div className={cn('w-full space-y-1.5', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex items-center rounded-xl border border-input bg-background px-3 py-2 shadow-sm transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          error && 'border-red-500 focus-within:ring-red-500',
          className
        )}
      >
        {icon && <span className="mr-2 text-muted-foreground">{icon}</span>}
        <input
          type={type}
          className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none disabled:opacity-60"
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id || label}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500" id={`${props.id || label}-error`}>
          {error}
        </p>
      )}
    </div>
  )
)

Input.displayName = 'Input'
