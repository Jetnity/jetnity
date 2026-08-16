// components/ui/label.tsx
'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const labelVariants = cva(
  'inline-flex min-w-0 max-w-full items-center gap-1 font-medium text-foreground transition-colors',
  {
    variants: {
      /** Satzlanger Text bricht um, statt in einer Zeile abgeschnitten zu werden */
      multiline: {
        true: 'items-start',
      },
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
      multiline: false,
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
  /**
   * Symbol links neben der Beschriftung.
   *
   * Bewusst als eigene Eigenschaft und nicht als Teil von `children`: Der
   * Beschriftungstext liegt in einem eigenen Element, damit er umbrechen oder
   * gekuerzt werden kann. Ein Symbol darin wuerde durch die Preflight-Regel
   * `svg { display: block }` eine eigene Zeile beanspruchen und damit ueber
   * dem Text stehen.
   */
  icon?: React.ReactNode
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (
    {
      className,
      children,
      required,
      optional,
      hint,
      icon,
      size,
      muted,
      invalid,
      animated,
      srOnly,
      multiline,
      ...props
    },
    ref
  ) => {
    // aria-* nur setzen, wenn sinnvoll; data-attribute für Styling hooks
    const ariaRequired = required ? true : undefined

    return (
      <label
        ref={ref}
        className={cn(
          labelVariants({ size, muted, invalid, animated, srOnly, multiline }),
          icon && 'gap-2',
          className
        )}
        aria-required={ariaRequired}
        data-required={required ? '' : undefined}
        {...props}
      >
        {icon && (
          <span aria-hidden="true" className="shrink-0">
            {icon}
          </span>
        )}

        {/* Haupttext */}
        <span className={cn('min-w-0', multiline ? 'whitespace-normal' : 'truncate')}>
          {children}
        </span>

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
