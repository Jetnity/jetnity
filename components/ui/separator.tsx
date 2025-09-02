'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type Orientation = 'horizontal' | 'vertical'
type Variant = 'solid' | 'dashed' | 'gradient'
type Thickness = 'hairline' | 'sm' | 'md' | 'lg'

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: Orientation
  /** nur fürs Screenreader-Hiding; sonst role="separator" */
  decorative?: boolean
  variant?: Variant
  thickness?: Thickness
}

/**
 * Separator – hochqualitative Trennlinie mit Varianten.
 * - orientation: horizontal | vertical
 * - variant: solid | dashed | gradient
 * - thickness: hairline | sm | md | lg
 */
export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  (
    {
      className,
      orientation = 'horizontal',
      decorative = false,
      variant = 'solid',
      thickness = 'sm',
      ...props
    },
    ref
  ) => {
    const isH = orientation === 'horizontal'

    // Stärke (Arbitrary values ok in Tailwind)
    const thicknessClass =
      variant === 'gradient'
        ? '' // bg-gradient nutzt keine border-width
        : thickness === 'hairline'
        ? 'border-[0.5px]'
        : thickness === 'sm'
        ? 'border'
        : thickness === 'md'
        ? 'border-2'
        : 'border-[3px]'

    const base =
      variant === 'gradient'
        ? cn(
            // weiche Verlaufslinie, respektiert Orientation
            isH
              ? 'h-[1px] w-full bg-gradient-to-r from-transparent via-border to-transparent'
              : 'w-[1px] h-full bg-gradient-to-b from-transparent via-border to-transparent'
          )
        : cn(
            isH ? 'w-full' : 'h-full',
            'bg-transparent', // wir nutzen border-* statt bg
            isH ? 'border-t' : 'border-l',
            thicknessClass,
            variant === 'dashed' ? 'border-dashed' : 'border-solid',
            'border-border'
          )

    return (
      <div
        ref={ref}
        role={decorative ? 'presentation' : 'separator'}
        aria-orientation={orientation}
        className={cn('shrink-0', base, className)}
        {...props}
      />
    )
  }
)
Separator.displayName = 'Separator'

/**
 * LabeledSeparator – Text mittig mit Linien links/rechts.
 */
export function LabeledSeparator({
  children,
  className,
  lineClassName,
  thickness = 'sm',
}: {
  children: React.ReactNode
  className?: string
  lineClassName?: string
  thickness?: Thickness
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Separator className={cn('flex-1', lineClassName)} thickness={thickness} />
      <span className="text-xs text-muted-foreground">{children}</span>
      <Separator className={cn('flex-1', lineClassName)} thickness={thickness} />
    </div>
  )
}
