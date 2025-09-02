// components/ui/label.tsx
'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const labelVariants = cva(
  'inline-flex items-center gap-1 font-medium text-foreground transition-colors',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
      muted: {
        true: 'text-muted-foreground',
      },
      invalid: {
        true: 'text-red-600',
      },
      animated: {
        true: 'hover:text-primary/90 focus-within:text-primary/90',
      },
      srOnly: {
        true: 'sr-only',
      },
    },
    defaultVariants: {
      size: 'md',
      muted: false,
      invalid: false,
      animated: false,
      srOnly: false,
    },
  }
)

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  /** Sternchen + ARIA, wenn Pflichtfeld */
  required?: boolean
  /** Zeige “(optional)” wenn NICHT required */
  optional?: boolean
  /** Kleiner Hinweis rechts (Text oder Icon/Node). Strings bekommen automatisch `title` */
  hint?: string | React.ReactNode
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (
    {
      className,
      children,
      required,
      optional,
      hint,
      size,
      muted,
      invalid,
      animated,
      srOnly,
      ...props
    },
    ref
  ) => {
    // aria-* nur setzen, wenn sinnvoll; data-attribute für Styling hooks
    const ariaRequired = required ? true : undefined

    return (
      <label
        ref={ref}
        className={cn(labelVariants({ size, muted, invalid, animated, srOnly }), className)}
        aria-required={ariaRequired}
        data-required={required ? '' : undefined}
        {...props}
      >
        {/* Haupttext */}
        <span className="truncate">{children}</span>

        {/* Required-Sternchen (dekorativ) */}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red-600">
            *
          </span>
        )}

        {/* Optional-Hinweis, nur wenn nicht required */}
        {!required && optional && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
        )}

        {/* Hinweis-Icon/Text rechts; Strings bekommen title für native Tooltip */}
        {hint
          ? typeof hint === 'string'
            ? (
              <span
                className="ml-1 select-none text-xs font-normal text-muted-foreground"
                title={hint}
                aria-label={hint}
              >
                ⓘ
              </span>
            )
            : <span className="ml-1 inline-flex items-center text-muted-foreground">{hint}</span>
          : null}
      </label>
    )
  }
)

Label.displayName = 'Label'

export { Label, labelVariants }
