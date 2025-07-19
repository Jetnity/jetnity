'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, icon, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className={cn(
          'flex items-center rounded-xl border border-input bg-background px-3 py-2 shadow-sm transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          error && 'border-red-500 focus-within:ring-red-500',
          className
        )}>
          {icon && <div className="mr-2 text-muted-foreground">{icon}</div>}
          <input
            type={type}
            className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
