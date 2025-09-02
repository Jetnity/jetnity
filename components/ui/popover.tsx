// components/ui/popover.tsx
'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'

/** Re-Exports für Konsistenz mit Radix */
const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverClose = PopoverPrimitive.Close
const PopoverAnchor = PopoverPrimitive.Anchor

/* ----------------------- Content Variants ----------------------- */

const popoverContentVariants = cva(
  [
    // Layout & Motion
    'z-50 rounded-xl border bg-popover text-popover-foreground shadow-md outline-none',
    'will-change-[transform,opacity] data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
    'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2',
    'animate-in fade-in-0 zoom-in-95',
    // Focus
    'focus-visible:ring-2 focus-visible:ring-ring',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'w-56 p-3',
        md: 'w-72 p-4',
        lg: 'w-96 p-5',
        auto: 'w-auto p-4',
      },
      elevated: {
        true: 'shadow-lg',
        false: '',
      },
      inset: {
        true: 'p-0', // z. B. für Menüs / Listen
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      elevated: false,
      inset: false,
    },
  }
)

type PrimitiveContentProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>

export interface PopoverContentProps
  extends PrimitiveContentProps,
    VariantProps<typeof popoverContentVariants> {
  /** Zeigt einen kleinen Pfeil an der Kante */
  withArrow?: boolean
  /** Falls du ein eigenes Portal-Ziel brauchst (z. B. innerhalb eines Panels) */
  portalContainer?: HTMLElement | null
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(
  (
    {
      className,
      size,
      elevated,
      inset,
      align = 'center',
      side = 'bottom',
      sideOffset = 8,
      collisionPadding = 8,
      withArrow = false,
      portalContainer,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <PopoverPrimitive.Portal container={portalContainer ?? undefined}>
        <PopoverPrimitive.Content
          ref={ref}
          align={align}
          side={side}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          className={cn(popoverContentVariants({ size, elevated, inset }), className)}
          {...props}
        >
          {children}
          {withArrow && (
            <PopoverPrimitive.Arrow
              width={12}
              height={6}
              className="fill-popover stroke-border"
            />
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    )
  }
)
PopoverContent.displayName = 'PopoverContent'

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverAnchor,
  popoverContentVariants,
}
