'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, max = 100, className, ...props }, ref) => (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        'w-full h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-teal-400 transition-all duration-500',
        )}
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
      />
    </div>
  )
)
Progress.displayName = 'Progress'
