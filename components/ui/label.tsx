'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  animated?: boolean
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, animated = false, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block text-sm font-medium text-foreground transition-all',
          animated && 'hover:text-primary/90',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
    )
  }
)

Label.displayName = 'Label'

export { Label }
