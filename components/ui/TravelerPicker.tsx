'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Users, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TravelerPickerProps {
  value: { adults: number; children: number }
  onChange: (val: { adults: number; children: number }) => void
  adultsLabel?: string
  childrenLabel?: string
  minAdults?: number
  maxAdults?: number
  minChildren?: number
  maxChildren?: number
  className?: string
}

export default function TravelerPicker({
  value,
  onChange,
  adultsLabel = 'Erwachsene',
  childrenLabel = 'Kinder',
  minAdults = 1,
  maxAdults = 8,
  minChildren = 0,
  maxChildren = 6,
  className,
}: TravelerPickerProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const labelId = useId()
  const descId = useId()

  const adults = value.adults ?? 0
  const children = value.children ?? 0
  const total = adults + children

  const canDecAdults = adults > minAdults
  const canIncAdults = adults < maxAdults
  const canDecChildren = children > minChildren
  const canIncChildren = children < maxChildren

  // Refs halten stets den aktuellen Wert – wichtig für Press&Hold
  const adultsRef = useRef(adults)
  const childrenRef = useRef(children)
  useEffect(() => { adultsRef.current = adults }, [adults])
  useEffect(() => { childrenRef.current = children }, [children])

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
  const setAdults = (n: number) =>
    onChange({ ...value, adults: clamp(n, minAdults, maxAdults) })
  const setChildren = (n: number) =>
    onChange({ ...value, children: clamp(n, minChildren, maxChildren) })

  const stepAdults = (delta: number) => setAdults(adultsRef.current + delta)
  const stepChildren = (delta: number) => setChildren(childrenRef.current + delta)

  const summary = useMemo(() => {
    const a = `${adults} ${pluralize(adultsLabel, adults)}`
    const c = children > 0 ? `, ${children} ${pluralize(childrenLabel, children)}` : ''
    return a + c
  }, [adults, children, adultsLabel, childrenLabel])

  // Outside-click / ESC
  useEffect(() => {
    if (!open) return
    const onDocPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (!rootRef.current?.contains(target)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDocPointer, { capture: true })
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('pointerdown', onDocPointer, { capture: true } as any)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  // Press & Hold
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const startHold = (fn: () => void) => {
    fn() // immediate step
    holdTimer.current = setTimeout(() => {
      holdInterval.current = setInterval(fn, 120)
    }, 400)
  }
  const stopHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current)
    if (holdInterval.current) clearInterval(holdInterval.current)
    holdTimer.current = null
    holdInterval.current = null
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${labelId}-panel` : undefined}
        className={cn(
          'w-full flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-base font-medium shadow-sm',
          'hover:bg-accent/30 transition',
          open && 'ring-2 ring-primary/50'
        )}
      >
        <Users className="h-5 w-5 text-muted-foreground" aria-hidden />
        <span className="truncate">{summary}</span>
        <span className="ml-auto text-sm text-muted-foreground tabular-nums">{total}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby={labelId}
          aria-describedby={descId}
          id={`${labelId}-panel`}
          className={cn(
            'absolute z-30 mt-2 w-72 rounded-xl border border-border bg-popover p-4 shadow-2xl',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          <div id={labelId} className="mb-1 text-sm font-semibold">Reisende auswählen</div>
          <p id={descId} className="mb-3 text-xs text-muted-foreground">
            {minAdults}–{maxAdults} {pluralize(adultsLabel, 2)} · {minChildren}–{maxChildren} {pluralize(childrenLabel, 2)}
          </p>

          <Row
            label={adultsLabel}
            value={adults}
            canDec={canDecAdults}
            canInc={canIncAdults}
            onDec={() => stepAdults(-1)}
            onInc={() => stepAdults(1)}
            onHoldStartDec={() => startHold(() => stepAdults(-1))}
            onHoldStartInc={() => startHold(() => stepAdults(1))}
            onHoldStop={stopHold}
          />

          <Row
            className="mt-2"
            label={childrenLabel}
            value={children}
            canDec={canDecChildren}
            canInc={canIncChildren}
            onDec={() => stepChildren(-1)}
            onInc={() => stepChildren(1)}
            onHoldStartDec={() => startHold(() => stepChildren(-1))}
            onHoldStartInc={() => startHold(() => stepChildren(1))}
            onHoldStop={stopHold}
          />

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Gesamt: <strong className="tabular-nums text-foreground">{total}</strong></span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs hover:bg-accent"
            >
              Fertig
            </button>
          </div>
        </div>
      )}

      <span className="sr-only" aria-live="polite">{summary}</span>
    </div>
  )
}

/* Subcomponents */

function Row({
  label,
  value,
  canDec,
  canInc,
  onDec,
  onInc,
  onHoldStartDec,
  onHoldStartInc,
  onHoldStop,
  className,
}: {
  label: string
  value: number
  canDec: boolean
  canInc: boolean
  onDec: () => void
  onInc: () => void
  onHoldStartDec: () => void
  onHoldStartInc: () => void
  onHoldStop: () => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <StepperButton
          ariaLabel={`${label} verringern`}
          disabled={!canDec}
          onClick={onDec}
          onHoldStart={onHoldStartDec}
          onHoldStop={onHoldStop}
        >
          <Minus className="h-4 w-4" />
        </StepperButton>

        <span className="w-7 text-center text-sm tabular-nums">{value}</span>

        <StepperButton
          ariaLabel={`${label} erhöhen`}
          disabled={!canInc}
          onClick={onInc}
          onHoldStart={onHoldStartInc}
          onHoldStop={onHoldStop}
        >
          <Plus className="h-4 w-4" />
        </StepperButton>
      </div>
    </div>
  )
}

function StepperButton({
  children,
  disabled,
  ariaLabel,
  onClick,
  onHoldStart,
  onHoldStop,
}: {
  children: React.ReactNode
  disabled?: boolean
  ariaLabel: string
  onClick: () => void
  onHoldStart: () => void
  onHoldStop: () => void
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={(e) => {
        if (disabled) return
        if (e.button !== 0) return // nur linke Taste
        onHoldStart()
      }}
      onPointerUp={onHoldStop}
      onPointerLeave={onHoldStop}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full border border-input bg-background',
        'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:opacity-40 disabled:cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}

/* helpers */

function pluralize(base: string, n: number) {
  // simple deutsche Pluralisierung – für diese Labels ausreichend
  return n === 1 ? base.replace(/e?n?$/, (m) => (m === 'en' ? '' : m)) : base
}
