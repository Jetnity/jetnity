'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { Slot } from '@radix-ui/react-slot'

/* ─────────────────────────── Variants / Types ─────────────────────────── */

const badgeBase = cva(
  [
    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5',
    'text-xs font-semibold',
    'transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
    'disabled:opacity-50 disabled:pointer-events-none',
    'select-none align-middle',
  ].join(' '),
  {
    variants: {
      size: {
        xs: 'text-[10px] px-1.5 py-0',
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-0.5',
      },
      appearance: {
        solid: '',
        soft: '',
        outline: 'bg-transparent',
        ghost: 'bg-transparent border-transparent',
      },
      tone: {
        neutral: '',
        primary: '',
        secondary: '',
        info: '',
        success: '',
        warning: '',
        danger: '',
      },
      interactive: {
        false: '',
        true: 'cursor-pointer hover:brightness-[.98] active:brightness-95',
      },
      selected: {
        false: '',
        true: 'ring-2 ring-offset-0',
      },
    },
    defaultVariants: {
      size: 'sm',
      appearance: 'soft',
      tone: 'neutral',
      interactive: false,
      selected: false,
    },
  }
)

type Appearance = NonNullable<VariantProps<typeof badgeBase>['appearance']>
type Tone = NonNullable<VariantProps<typeof badgeBase>['tone']>

/** Farbe+Auftritt → Tailwind-Klassen (mit sicheren Defaults) */
function toneStyles(appearance?: Appearance, tone?: Tone) {
  const a: Appearance = appearance ?? 'soft'
  const t: Tone = tone ?? 'neutral'
  const map: Record<Appearance, Record<Tone, string>> = {
    solid: {
      neutral: 'bg-muted text-foreground border-transparent',
      primary: 'bg-primary text-primary-foreground border-transparent',
      secondary: 'bg-secondary text-secondary-foreground border-transparent',
      info: 'bg-blue-600 text-white border-transparent',
      success: 'bg-green-600 text-white border-transparent',
      warning: 'bg-yellow-600 text-black border-transparent',
      danger: 'bg-red-600 text-white border-transparent',
    },
    soft: {
      neutral: 'bg-muted/60 text-foreground border-muted',
      primary: 'bg-primary/10 text-primary border-primary/20',
      secondary: 'bg-secondary/20 text-secondary-foreground border-secondary/30',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-900 border-yellow-200',
      danger: 'bg-red-100 text-red-800 border-red-200',
    },
    outline: {
      neutral: 'text-foreground border-muted',
      primary: 'text-primary border-primary/40',
      secondary: 'text-secondary-foreground border-secondary/50',
      info: 'text-blue-700 border-blue-300',
      success: 'text-green-700 border-green-300',
      warning: 'text-yellow-900 border-yellow-300',
      danger: 'text-red-700 border-red-300',
    },
    ghost: {
      neutral: 'text-foreground/80 hover:bg-muted/40',
      primary: 'text-primary hover:bg-primary/10',
      secondary: 'text-secondary-foreground hover:bg-secondary/20',
      info: 'text-blue-700 hover:bg-blue-100',
      success: 'text-green-700 hover:bg-green-100',
      warning: 'text-yellow-900 hover:bg-yellow-100',
      danger: 'text-red-700 hover:bg-red-100',
    },
  }
  return map[a][t]
}

/* ───────────── Legacy-Unterstützung: variant → appearance/tone ─────────── */

export type LegacyVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'

function mapLegacyVariant(variant: LegacyVariant | undefined): {
  appearance?: Appearance
  tone?: Tone
} {
  if (!variant) return {}
  const map: Record<LegacyVariant, { appearance: Appearance; tone: Tone }> = {
    default: { appearance: 'solid', tone: 'primary' },
    secondary: { appearance: 'soft', tone: 'secondary' },
    outline: { appearance: 'outline', tone: 'neutral' },
    info: { appearance: 'soft', tone: 'info' },
    success: { appearance: 'soft', tone: 'success' },
    warning: { appearance: 'soft', tone: 'warning' },
    error: { appearance: 'soft', tone: 'danger' },
  }
  return map[variant]
}

/* ─────────────────────────────────── Badge ───────────────────────────────── */

export interface BadgeProps
  extends Omit<React.ComponentPropsWithoutRef<'span'>, 'color'>,
    VariantProps<typeof badgeBase> {
  /** Abwärtskompatibel: alter API-Stil (<Badge variant="info"/>) */
  variant?: LegacyVariant
  /** Als anderes Element rendern (z.B. <Link>, <button>) */
  asChild?: boolean
  /** Kleiner farbiger Punkt zu Beginn (Status) */
  dot?: boolean
  /** Schließen-Icon anzeigen */
  withClose?: boolean
  /** Close-Handler (nur wenn withClose) */
  onClose?: (e: React.MouseEvent<HTMLButtonElement>) => void
  /** Icon vorne/hinten (ReactNode) */
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    className,
    size,
    appearance,
    tone,
    interactive,
    selected,
    asChild,
    dot,
    withClose,
    onClose,
    startIcon,
    endIcon,
    variant, // <- legacy
    children,
    ...props
  },
  ref
) {
  // Legacy-Variant nur anwenden, wenn appearance/tone nicht explizit übergeben wurden
  const legacy = (!appearance && !tone) ? mapLegacyVariant(variant) : {}

  const finalAppearance = (appearance ?? legacy.appearance ?? 'soft') as Appearance
  const finalTone = (tone ?? legacy.tone ?? 'neutral') as Tone

  const Comp = asChild ? Slot : 'span'
  const interactiveAuto = interactive ?? (!!props.onClick || asChild)
  const colorCls = toneStyles(finalAppearance, finalTone)

  return (
    <Comp
      ref={ref as any}
      className={cn(
        badgeBase({
          size,
          appearance: finalAppearance,
          tone: finalTone,
          interactive: interactiveAuto,
          selected,
        }),
        colorCls,
        // dezente Ringe bei selected je nach Ton (außer solid)
        selected && finalAppearance !== 'solid' && finalTone === 'primary' && 'ring-primary/30',
        selected && finalAppearance !== 'solid' && finalTone === 'info' && 'ring-blue-300/60',
        selected && finalAppearance !== 'solid' && finalTone === 'success' && 'ring-green-300/60',
        selected && finalAppearance !== 'solid' && finalTone === 'warning' && 'ring-yellow-300/70',
        selected && finalAppearance !== 'solid' && finalTone === 'danger' && 'ring-red-300/60',
        className
      )}
      {...props}
    >
      {dot && <BadgeDot tone={finalTone} />}
      {startIcon ? <span className="inline-flex shrink-0">{startIcon}</span> : null}
      <span className="truncate">{children}</span>
      {endIcon ? <span className="inline-flex shrink-0">{endIcon}</span> : null}
      {withClose && (
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'ml-1 inline-grid h-4 w-4 place-items-center rounded',
            'hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
          )}
          aria-label="Entfernen"
          tabIndex={0}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Comp>
  )
})
Badge.displayName = 'Badge'

/* ──────────────────────────────── Extras ──────────────────────────────── */

export function BadgeDot({
  tone = 'neutral',
  className,
}: {
  tone?: Tone
  className?: string
}) {
  const cls: Record<Tone, string> = {
    neutral: 'bg-zinc-400',
    primary: 'bg-primary',
    secondary: 'bg-zinc-500',
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  }
  return <span className={cn('mr-1 inline-block h-1.5 w-1.5 rounded-full', cls[tone], className)} />
}

export function BadgeGroup({
  children,
  max = 4,
  className,
}: {
  children: React.ReactNode
  max?: number
  className?: string
}) {
  const arr = React.Children.toArray(children).filter(Boolean)
  const visible = arr.slice(0, max)
  const rest = arr.length - visible.length
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {visible}
      {rest > 0 && <Badge size="xs" appearance="soft" tone="neutral">+{rest}</Badge>}
    </div>
  )
}
