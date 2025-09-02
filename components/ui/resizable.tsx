// components/ui/resizable.tsx
'use client'

import * as React from 'react'
import {
  PanelGroup as BaseGroup,
  Panel as BasePanel,
  PanelResizeHandle as BaseHandle,
  type ImperativePanelHandle,
  type PanelProps as BasePanelProps,
  type PanelGroupProps as BaseGroupProps,
} from 'react-resizable-panels'
import { cn } from '@/lib/utils'

/**
 * Gruppiert Panels. Zusätzlich:
 * - storageKey -> mapped auf react-resizable-panels `autoSaveId` (persistiert in localStorage)
 */
export type ResizableGroupProps = BaseGroupProps & {
  className?: string
  /** persistiert Layout in localStorage (Alias auf `autoSaveId`) */
  storageKey?: string
}

export function ResizableGroup({
  className,
  storageKey,
  ...props
}: ResizableGroupProps) {
  return (
    <BaseGroup
      {...props}
      autoSaveId={storageKey ?? (props as any).autoSaveId}
      className={cn('h-full w-full', className)}
    />
  )
}

/**
 * Panel – nur ein dünner Wrapper für konsistente Styles.
 */
export type ResizablePanelProps = BasePanelProps & {
  className?: string
  children?: React.ReactNode
}

export const ResizablePanel = React.forwardRef<
  ImperativePanelHandle,
  ResizablePanelProps
>(function ResizablePanel({ className, children, ...props }, ref) {
  return (
    <BasePanel
      ref={ref}
      {...props}
      className={cn('h-full overflow-hidden', className)}
    >
      {children}
    </BasePanel>
  )
})

/**
 * Handle mit "Grip"-Optik, A11y-Label und optionalem Double-Click-Reset-Hook.
 */
type HandleProps = React.ComponentProps<typeof BaseHandle> & {
  className?: string
  /** Zeige die dünne Griff-Fläche */
  withGrip?: boolean
  /** A11y-Label für Screenreader */
  ariaLabel?: string
  /** Bei Doppelklick onReset aufrufen (z. B. um ein Default-Layout herzustellen) */
  resetOnDoubleClick?: boolean
  onReset?: () => void
}

export function ResizableHandle({
  className,
  withGrip = true,
  ariaLabel = 'Bereichsgröße ändern',
  resetOnDoubleClick = false,
  onReset,
  ...props
}: HandleProps) {
  return (
    <BaseHandle
      {...props}
      aria-label={ariaLabel}
      onDoubleClick={resetOnDoubleClick ? onReset : undefined}
      className={cn(
        // Basis
        'group relative flex items-center justify-center transition-colors',
        // Größe & Cursor je Orientierung (kommt als data-Attribut vom Handle)
        'data-[orientation=vertical]:w-2 data-[orientation=horizontal]:h-2',
        'data-[orientation=vertical]:cursor-col-resize data-[orientation=horizontal]:cursor-row-resize',
        className
      )}
    >
      {withGrip && (
        <div
          aria-hidden
          className={cn(
            'pointer-events-none rounded-full text-border opacity-60 group-hover:opacity-100',
            // Maße an Orientierung koppeln (über group-data)
            'group-data-[orientation=vertical]:h-8 group-data-[orientation=vertical]:w-[3px]',
            'group-data-[orientation=horizontal]:w-8 group-data-[orientation=horizontal]:h-[3px]',
            // feine Stripes für mehr "Grip"
            'group-data-[orientation=vertical]:bg-[repeating-linear-gradient(0deg,transparent,transparent_4px,currentColor_4px,currentColor_6px)]',
            'group-data-[orientation=horizontal]:bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,currentColor_4px,currentColor_6px)]'
          )}
        />
      )}
    </BaseHandle>
  )
}
