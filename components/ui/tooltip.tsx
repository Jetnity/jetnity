'use client'

import * as React from 'react'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

export const TooltipProvider = RadixTooltip.Provider

export const Tooltip = RadixTooltip.Root

export const TooltipTrigger = RadixTooltip.Trigger

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof RadixTooltip.Content>,
  React.ComponentPropsWithoutRef<typeof RadixTooltip.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <RadixTooltip.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-xl bg-neutral-950 px-3 py-2 text-sm text-neutral-50 shadow-xl animate-fadeIn',
      'border border-neutral-700',
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = RadixTooltip.Content.displayName
