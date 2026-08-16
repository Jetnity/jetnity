'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------------
   Variants & Types
----------------------------------------------------------------------------- */

const cardVariants = cva(
  [
    // Base
    'group relative rounded-2xl border text-foreground transition-shadow',
    // Colors via semantic tokens (shadcn compatible)
    'bg-card border-border shadow-sm',
    // High-DPI + motion polish
    'will-change-transform',
  ].join(' '),
  {
    variants: {
      variant: {
        default: '',
        soft:
          'bg-muted/40 border-transparent shadow-sm hover:shadow-md dark:bg-muted/20',
        outline: 'bg-background border-border shadow-none',
        ghost: 'bg-transparent border-transparent shadow-none',
        elevated:
          'bg-card border-transparent shadow-md hover:shadow-lg dark:shadow-black/40',
      },
      interactive: {
        true: [
          'cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'hover:shadow-md active:shadow-sm',
        ].join(' '),
        false: '',
      },
      padding: {
        // Controls default inner padding for header/content/footer helpers
        sm: '',
        md: '',
        lg: '',
      },
      radius: {
        md: 'rounded-xl',
        lg: 'rounded-2xl',
        full: 'rounded-3xl',
      },
      inset: {
        true:
          'ring-1 ring-black/0 [--card-inset:calc(theme(spacing.3))] dark:[--card-inset:calc(theme(spacing.2.5))]',
        false: '[--card-inset:calc(theme(spacing.0))]',
      },
    },
    defaultVariants: {
      variant: 'default',
      interactive: false,
      padding: 'md',
      radius: 'lg',
      inset: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Rendere den Card-Inhalt polymorph (z. B. mit <Link> als Child) */
  asChild?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, padding, radius, inset, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div'
    return (
      <Comp
        ref={ref as any}
        className={cn(cardVariants({ variant, interactive, padding, radius, inset }), className)}
        data-padding={padding}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

/* -----------------------------------------------------------------------------
   Building blocks
----------------------------------------------------------------------------- */

export interface CardSectionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Dünnere Section-Paddings unabhängig vom Card-Default */
  size?: 'sm' | 'md' | 'lg'
  /** Dünne Trennlinie an Kopf/Ende der Section */
  withDivider?: boolean
  /** Sticky Header/Footer (z. B. in scrollbaren Cards) */
  sticky?: boolean
}

const padMap = { sm: 'p-4', md: 'p-6', lg: 'p-8' }

const resolvePad = (fromAttr: 'sm' | 'md' | 'lg' | undefined, el?: HTMLElement | null) => {
  // liest das data-padding vom Card-Container als Fallback
  const parentPad =
    (el?.closest('[data-padding]')?.getAttribute('data-padding') as 'sm' | 'md' | 'lg' | null) ??
    'md'
  return padMap[fromAttr ?? parentPad]
}

const CardHeader = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, size, withDivider, sticky, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        resolvePad(size, (ref as any)?.current) ?? padMap.md,
        'flex flex-col gap-1.5',
        sticky && 'sticky top-0 z-10 bg-inherit/90 backdrop-blur supports-[backdrop-filter]:bg-inherit/60',
        withDivider && 'border-b',
        className
      )}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { as?: 'h2' | 'h3' | 'h4' }
>(({ className, as = 'h3', ...props }, ref) => {
  const Comp = as
  return (
    <Comp
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
})
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, size, withDivider, sticky, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        resolvePad(size, (ref as any)?.current) ?? padMap.md,
        sticky && 'sticky top-0 z-10 bg-inherit/90 backdrop-blur supports-[backdrop-filter]:bg-inherit/60',
        withDivider && 'border-b',
        className
      )}
      {...props}
    />
  )
)
CardContent.displayName = 'CardContent'

/* -----------------------------------------------------------------------------
   Exports
----------------------------------------------------------------------------- */

export { Card, CardHeader, CardTitle, CardDescription, CardContent }
