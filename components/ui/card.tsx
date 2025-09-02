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

const CardToolbar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('ml-auto flex items-center gap-1.5', className)}
      {...props}
    />
  )
)
CardToolbar.displayName = 'CardToolbar'

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

const CardFooter = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, size, withDivider, sticky, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        resolvePad(size, (ref as any)?.current) ?? padMap.md,
        'flex items-center',
        sticky && 'sticky bottom-0 z-10 bg-inherit/90 backdrop-blur supports-[backdrop-filter]:bg-inherit/60',
        withDivider && 'border-t',
        className
      )}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

/* -----------------------------------------------------------------------------
   Media & Badges
----------------------------------------------------------------------------- */

export interface CardMediaProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Aspect Ratio Utility (Tailwind): z.B. 'aspect-video', 'aspect-square' … */
  ratioClassName?: string
  /** Optionales Bild – oder eigenen Inhalt via children */
  src?: string
  alt?: string
  /** Rounded oben abschließen */
  roundedTop?: boolean
}

const CardMedia = React.forwardRef<HTMLDivElement, CardMediaProps>(
  ({ className, ratioClassName = 'aspect-video', src, alt = '', roundedTop = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          ratioClassName,
          roundedTop && 'rounded-t-2xl',
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          children
        )}
      </div>
    )
  }
)
CardMedia.displayName = 'CardMedia'

export interface CardBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

const posMap: Record<NonNullable<CardBadgeProps['position']>, string> = {
  'top-left': 'left-3 top-3',
  'top-right': 'right-3 top-3',
  'bottom-left': 'left-3 bottom-3',
  'bottom-right': 'right-3 bottom-3',
}

const CardBadge = React.forwardRef<HTMLDivElement, CardBadgeProps>(
  ({ className, position = 'top-right', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'pointer-events-none absolute z-20 select-none rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white backdrop-blur',
        posMap[position],
        className
      )}
      {...props}
    />
  )
)
CardBadge.displayName = 'CardBadge'

/* -----------------------------------------------------------------------------
   Skeleton (Loading)
----------------------------------------------------------------------------- */

const CardSkeleton = React.forwardRef<HTMLDivElement, { lines?: number } & React.HTMLAttributes<HTMLDivElement>>(
  ({ className, lines = 3, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant: 'outline', radius: 'lg' }),
          'animate-pulse',
          className
        )}
        {...props}
      >
        <div className="h-40 w-full rounded-t-2xl bg-muted" />
        <div className="space-y-3 p-6">
          <div className="h-5 w-1/3 rounded bg-muted" />
          {Array.from({ length: Math.max(1, lines) }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-muted" />
          ))}
        </div>
      </div>
    )
  }
)
CardSkeleton.displayName = 'CardSkeleton'

/* -----------------------------------------------------------------------------
   Exports
----------------------------------------------------------------------------- */

export {
  cardVariants,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardToolbar,
  CardContent,
  CardFooter,
  CardMedia,
  CardBadge,
  CardSkeleton,
}
