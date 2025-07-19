'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  placeholder?: string
  error?: string
  label?: string
  containerClassName?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      containerClassName,
      options,
      placeholder = 'Bitte auswählen',
      error,
      label,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || React.useId()
    return (
      <div className={cn('w-full space-y-1.5', containerClassName)}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'block w-full appearance-none rounded-xl border bg-background px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-primary disabled:opacity-50',
              error ? 'border-red-500 focus:ring-red-500' : 'border-border',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : undefined}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        {error && (
          <p className="text-xs text-red-500" id={`${selectId}-error`}>
            {error}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
