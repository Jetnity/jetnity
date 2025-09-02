// components/ui/SectionHeader.tsx
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge as UIBadge } from '@/components/ui/badge'

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'info' | 'success' | 'warning' | 'error'
type ObjBadge = { text: string; variant?: BadgeVariant; className?: string }

export type SectionHeaderProps = {
  /** Haupttitel (string oder ReactNode) */
  title: React.ReactNode
  /** Untertitel/Description – alias: `description` */
  subtitle?: React.ReactNode
  description?: React.ReactNode
  /** Kleines Eyebrow/Overline oberhalb */
  eyebrow?: React.ReactNode
  /** Rechts ausgerichtete Aktionen (Buttons, etc.) */
  actions?: React.ReactNode
  /** Breadcrumbs oder Pfadangabe über Eyebrow */
  breadcrumbs?: React.ReactNode
  /** Tabs/Segmented Control unterhalb des Headers */
  tabs?: React.ReactNode
  /** Optional: Badge (als Node oder Objekt) */
  badge?: React.ReactNode | ObjBadge
  /** Optional: Icon links neben dem Titel */
  icon?: React.ReactNode
  /** Optional: Avatar links neben dem Titel (wenn gesetzt, hat Vorrang vor `icon`) */
  avatarSrc?: string
  /** KPI-Chips unter Subtitle */
  kpis?: Array<{ label: React.ReactNode; value: React.ReactNode }>
  /** Ausrichtung des Inhalts */
  align?: 'left' | 'center' | 'right'
  /** Größen-Preset */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Farb-/Typo-Variante für den Titel */
  variant?: 'default' | 'muted' | 'brand' | 'gradient'
  /** Unterstreichungs-Stil unter dem Titelbereich */
  underline?: 'none' | 'border' | 'accent' | 'gradient'
  /** Sticky Header (z. B. in Panels) */
  sticky?: boolean
  /** Untere Divider-Linie */
  divider?: boolean
  /** Spacing um den Headerblock */
  spacing?: 'compact' | 'normal' | 'loose'
  /** Überschrift-Tag (für Semantik) */
  as?: 'h1' | 'h2' | 'h3'
  className?: string
  children?: React.ReactNode
}

const sizeMap = {
  sm: { title: 'text-lg', subtitle: 'text-sm', gap: 'gap-1', media: 'h-8 w-8', padY: 'py-3' },
  md: { title: 'text-2xl', subtitle: 'text-sm', gap: 'gap-1.5', media: 'h-10 w-10', padY: 'py-4' },
  lg: { title: 'text-3xl', subtitle: 'text-base', gap: 'gap-2', media: 'h-12 w-12', padY: 'py-5' },
  xl: { title: 'text-4xl', subtitle: 'text-base', gap: 'gap-2', media: 'h-14 w-14', padY: 'py-6' },
} as const

function renderBadge(badge?: React.ReactNode | ObjBadge) {
  if (!badge) return null
  if (React.isValidElement(badge)) return badge
  const b = badge as ObjBadge
  return <UIBadge variant={b.variant ?? 'secondary'} className={cn('ml-2', b.className)}>{b.text}</UIBadge>
}

export default function SectionHeader({
  title,
  subtitle,
  description,
  eyebrow,
  actions,
  breadcrumbs,
  tabs,
  badge,
  icon,
  avatarSrc,
  kpis,
  align = 'left',
  size = 'md',
  variant = 'default',
  underline = 'none',
  sticky = false,
  divider = false,
  spacing = 'normal',
  as = 'h2',
  className,
  children,
}: SectionHeaderProps) {
  const S = as
  const sz = sizeMap[size]
  const desc = subtitle ?? description

  const alignCls =
    align === 'center' ? 'text-center items-center' : align === 'right' ? 'text-right items-end' : 'text-left items-start'

  const titleColor =
    variant === 'muted'
      ? 'text-muted-foreground'
      : variant === 'brand'
      ? 'text-foreground'
      : variant === 'gradient'
      ? 'bg-gradient-to-r from-blue-600 via-sky-500 to-teal-400 bg-clip-text text-transparent'
      : 'text-foreground'

  const underNode =
    underline === 'border' ? (
      <div className="mt-3 border-b" />
    ) : underline === 'accent' ? (
      <div className="mt-2 h-1 w-16 rounded-full bg-primary/80" />
    ) : underline === 'gradient' ? (
      <div className="mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-teal-400" />
    ) : null

  const wrapPad =
    spacing === 'compact' ? 'pb-2' : spacing === 'loose' ? 'pb-6' : 'pb-4'

  return (
    <div
      className={cn(
        'w-full',
        sticky && 'sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        wrapPad,
        divider && 'border-b',
        className
      )}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <div className={cn('mb-1 text-xs text-muted-foreground', align === 'center' && 'text-center', align === 'right' && 'text-right')}>
          {breadcrumbs}
        </div>
      )}

      {/* Top Row: Media + Text + Actions */}
      <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between')}>
        {/* Left: Media + Text */}
        <div className={cn('flex w-full flex-col', alignCls)}>
          {/* Eyebrow */}
          {eyebrow && (
            <div className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {eyebrow}
            </div>
          )}

          {/* Media + Title line */}
          <div className={cn('flex flex-row items-center', align === 'center' && 'justify-center', align === 'right' && 'justify-end')}>
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt=""
                className={cn('mr-3 rounded-full object-cover ring-2 ring-border', sz.media)}
              />
            ) : icon ? (
              <span className={cn('mr-3 inline-flex items-center justify-center rounded-xl bg-muted p-2 text-muted-foreground', size !== 'sm' && 'p-2.5')}>
                {icon}
              </span>
            ) : null}

            <S className={cn('font-semibold tracking-tight', sz.title, titleColor)}>
              <span className="align-middle">{title}</span>
              {renderBadge(badge)}
            </S>
          </div>

          {/* Subtitle / Description */}
          {desc && (
            <p className={cn('mt-1 max-w-prose text-muted-foreground', sz.subtitle)}>
              {desc}
            </p>
          )}

          {/* KPIs */}
          {Array.isArray(kpis) && kpis.length > 0 && (
            <div className="mt-3 grid w-full grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {kpis.map((k, i) => (
                <div key={i} className="rounded-lg border bg-card/60 px-3 py-2 text-left">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{k.label}</div>
                  <div className="text-sm font-semibold text-foreground">{k.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Underline */}
          {underNode}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
            {actions}
          </div>
        )}
      </div>

      {/* Tabs / Controls below */}
      {tabs && <div className="mt-3">{tabs}</div>}

      {/* Extra content slot */}
      {children}
    </div>
  )
}

/* ---------------- Skeleton ---------------- */

export function SectionHeaderSkeleton({
  lines = 2,
  className,
}: { lines?: number; className?: string }) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="mb-2 h-5 w-24 rounded bg-muted" />
      <div className="mb-2 h-7 w-64 rounded bg-muted" />
      {Array.from({ length: Math.max(1, lines) }).map((_, i) => (
        <div key={i} className="mb-1.5 h-4 w-80 max-w-[85%] rounded bg-muted" />
      ))}
      <div className="mt-3 h-[1px] w-24 rounded bg-muted" />
    </div>
  )
}
