'use client'

import * as React from 'react'
import * as RT from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

/**
 * Provider – mit sinnvollen Defaults:
 * - delayDuration: 200ms
 * - skipDelayDuration: 300ms (serielle Tooltips fühlen sich flüssiger an)
 */
export function TooltipProvider({
  children,
  delayDuration = 200,
  skipDelayDuration = 300,
}: React.ComponentPropsWithoutRef<typeof RT.Provider>) {
  return (
    <RT.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
      {children}
    </RT.Provider>
  )
}

/** Root & Trigger einfach re-exportieren (shadcn-Style) */
export const Tooltip = RT.Root
export const TooltipTrigger = RT.Trigger

type Tone = 'default' | 'inverted' | 'brand'
type Size = 'sm' | 'md' | 'lg'
type Radius = 'md' | 'lg' | 'full'

export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof RT.Content> {
  /** Farbvariante */
  tone?: Tone
  /** Größe (Padding/Font) */
  size?: Size
  /** Rundung */
  radius?: Radius
  /** Pfeil ein-/ausblenden */
  withArrow?: boolean
}

/**
 * TooltipContent – A11y-stark, themable, mit Arrow und sauberen Animationsklassen.
 * Nutzt Radix Collision Handling & Portaling out-of-the-box.
 */
export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof RT.Content>,
  TooltipContentProps
>(function TooltipContent(
  {
    className,
    sideOffset = 6,
    collisionPadding = 8,
    tone = 'default',
    size = 'md',
    radius = 'lg',
    withArrow = true,
    children,
    ...props
  },
  ref
) {
  const toneClass =
    tone === 'inverted'
      ? 'bg-neutral-950 text-neutral-50 border-neutral-800'
      : tone === 'brand'
      ? 'bg-primary text-primary-foreground border-primary/40'
      : 'bg-popover text-popover-foreground border-border'

  const sizeClass =
    size === 'sm'
      ? 'px-2.5 py-1.5 text-xs'
      : size === 'lg'
      ? 'px-4 py-2.5 text-base'
      : 'px-3 py-2 text-sm'

  const radiusClass =
    radius === 'md' ? 'rounded-md' : radius === 'full' ? 'rounded-full' : 'rounded-xl'

  return (
    <RT.Portal>
      <RT.Content
        ref={ref}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'z-50 will-change-[transform,opacity] border shadow-xl',
          // Enter/Exit & Directional Animate (tailwindcss-animate kompatibel)
          'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out',
          'data-[state=delayed-open]:fade-in-0 data-[state=closed]:fade-out-0',
          'data-[side=top]:slide-in-from-bottom-1',
          'data-[side=right]:slide-in-from-left-1',
          'data-[side=bottom]:slide-in-from-top-1',
          'data-[side=left]:slide-in-from-right-1',
          toneClass,
          sizeClass,
          radiusClass,
          className
        )}
        {...props}
      >
        {children}
        {withArrow && (
          <RT.Arrow
            className={cn(
              // Arrow erbt aktuelle Textfarbe → wir setzen einen passenden Fill
              'fill-current text-inherit drop-shadow-[0_1px_1px_rgba(0,0,0,0.06)]'
            )}
            width={10}
            height={6}
          />
        )}
      </RT.Content>
    </RT.Portal>
  )
})

/* ───────────── Rich Tooltip Bits (optional) ───────────── */

export function TooltipTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-[13px] font-semibold leading-none', className)} {...props} />
}

export function TooltipDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('mt-1 max-w-[280px] text-[12px] leading-snug text-muted-foreground', className)}
      {...props}
    />
  )
}

/** Tastaturkürzel hübsch gerendert: <TooltipShortcut keys="⌘K" /> oder ["Ctrl","K"] */
export function TooltipShortcut({
  keys,
  className,
}: {
  keys: string | string[]
  className?: string
}) {
  const list = Array.isArray(keys) ? keys : [keys]
  return (
    <span className={cn('ml-2 inline-flex items-center gap-1 text-[11px] opacity-80', className)}>
      {list.map((k, i) => (
        <kbd
          key={`${k}-${i}`}
          className="rounded-[6px] border border-border bg-muted px-1.5 py-[2px] font-mono text-[10px]"
        >
          {k}
        </kbd>
      ))}
    </span>
  )
}
