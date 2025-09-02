// components/ui/progress.tsx
'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const trackVariants = cva(
  'relative w-full overflow-hidden bg-muted/60',
  {
    variants: {
      size: {
        xs: 'h-2 rounded-md',
        sm: 'h-2.5 rounded-md',
        md: 'h-3 rounded-lg',
        lg: 'h-4 rounded-xl',
      },
      rounded: {
        md: '',
        lg: '',
        full: 'rounded-full',
      },
    },
    defaultVariants: { size: 'md', rounded: 'lg' },
  }
)

const barVariants = cva(
  'absolute left-0 top-0 h-full transition-all duration-500 ease-out',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-blue-600 via-sky-500 to-teal-400',
        success:
          'bg-gradient-to-r from-emerald-600 via-green-500 to-lime-400',
        warning:
          'bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500',
        danger:
          'bg-gradient-to-r from-rose-600 via-red-500 to-orange-500',
        neutral:
          'bg-gradient-to-r from-zinc-500 via-zinc-400 to-zinc-300',
      },
      striped: {
        true:
          // dezente Stripes (ohne extra CSS-Keyframes)
          'bg-[length:1rem_1rem] bg-[linear-gradient(45deg,rgba(255,255,255,.25)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.25)_50%,rgba(255,255,255,.25)_75%,transparent_75%,transparent)]',
        false: '',
      },
      animated: {
        true: 'motion-safe:animate-pulse',
        false: '',
      },
    },
    defaultVariants: { variant: 'primary', striped: false, animated: false },
  }
)

export interface ProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'value'>,
    VariantProps<typeof trackVariants>,
    VariantProps<typeof barVariants> {
  /** aktueller Fortschritt (0..max). Lässt sich weglassen, wenn `indeterminate` */
  value?: number | null
  /** Standard: 100 */
  max?: number
  /** Optionaler Buffer-Wert (z. B. Streaming/Prefetch), 0..max */
  buffer?: number | null
  /** Unbestimmter Zustand – zeigt eine pulsierende Teilfüllung */
  indeterminate?: boolean
  /** Label anzeigen (innen/außen) */
  showLabel?: boolean | 'inside' | 'outside'
  /** Label-Formatter */
  formatLabel?: (value: number, max: number) => string
  /** Für Screenreader: textuelle Beschreibung des Status */
  valueText?: string
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value = 0,
      max = 100,
      buffer = null,
      indeterminate = false,
      size,
      rounded,
      variant,
      striped,
      animated,
      showLabel = false,
      formatLabel = (v, m) => `${Math.round((v / m) * 100)}%`,
      className,
      valueText,
      ...props
    },
    ref
  ) => {
    const safeMax = Math.max(1, Number.isFinite(max) ? max : 100)
    const val = Math.min(safeMax, Math.max(0, Number(value ?? 0)))
    const buf = buffer == null ? null : Math.min(safeMax, Math.max(0, Number(buffer)))
    const pct = indeterminate ? 40 : (val / safeMax) * 100
    const bufPct = buf == null ? null : (buf / safeMax) * 100

    const label = formatLabel(val, safeMax)
    const showInside = showLabel === true || showLabel === 'inside'
    const showOutside = showLabel === 'outside'

    return (
      <div className="w-full space-y-1">
        <div
          ref={ref}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={safeMax}
          aria-valuenow={indeterminate ? undefined : Math.round(val)}
          aria-valuetext={valueText ?? (indeterminate ? 'In Bearbeitung' : label)}
          aria-busy={indeterminate || undefined}
          className={cn(trackVariants({ size, rounded }), className)}
          {...props}
        >
          {/* Buffer-Layer */}
          {bufPct != null && !indeterminate && (
            <div
              className="absolute left-0 top-0 h-full bg-muted"
              style={{ width: `${Math.min(100, Math.max(0, bufPct))}%` }}
              aria-hidden
            />
          )}

          {/* Progress-Layer */}
          <div
            className={cn(barVariants({ variant, striped, animated }), indeterminate && 'motion-safe:animate-pulse')}
            style={{
              width: `${indeterminate ? pct : Math.min(100, Math.max(0, pct))}%`,
            }}
          />

          {/* Label inside */}
          {showInside && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="select-none text-[11px] font-medium text-white drop-shadow">
                {indeterminate ? '…' : label}
              </span>
            </div>
          )}
        </div>

        {/* Label outside */}
        {showOutside && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{valueText ?? 'Fortschritt'}</span>
            <span className="font-medium text-foreground">{indeterminate ? '…' : label}</span>
          </div>
        )}
      </div>
    )
  }
)
Progress.displayName = 'Progress'
