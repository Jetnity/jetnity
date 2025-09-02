'use client'

import * as React from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type Key = '30' | '90' | '180' | 'all'
type RangeDef = { key: Key; label: string; title?: string }
type Size = 'sm' | 'md' | 'lg'

const DEFAULT_RANGES: readonly RangeDef[] = [
  { key: '30', label: '30T', title: 'Letzte 30 Tage' },
  { key: '90', label: '90T', title: 'Letzte 90 Tage' },
  { key: '180', label: '180T', title: 'Letzte 180 Tage' },
  { key: 'all', label: 'Gesamt', title: 'Gesamter Zeitraum' },
] as const

export default function TimeframeTabs({
  param = 'range',
  ranges = DEFAULT_RANGES,
  defaultKey = '90',
  size = 'md',
  className,
  ariaLabel = 'Zeitraum wählen',
}: {
  param?: string
  ranges?: readonly RangeDef[]
  defaultKey?: Key
  size?: Size
  className?: string
  ariaLabel?: string
}) {
  const pathname = usePathname()
  const search = useSearchParams()
  const router = useRouter()

  const keys = React.useMemo(() => ranges.map((r) => r.key), [ranges])
  const raw = (search.get(param) ?? defaultKey).toLowerCase() as Key
  const current: Key = (keys as readonly string[]).includes(raw) ? raw : defaultKey

  // Größen
  const pad =
    size === 'sm' ? 'px-2.5 py-1 text-[13px]' : size === 'lg' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-sm'
  const h = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-10' : 'h-9'

  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const btnRefs = React.useRef<Partial<Record<Key, HTMLButtonElement>>>({})

  // Ref-Callback: gibt **void** zurück → TS happy
  const refFor = React.useCallback(
    (key: Key) =>
      (el: HTMLButtonElement | null) => {
        if (el) btnRefs.current[key] = el
        else delete btnRefs.current[key]
      },
    []
  )

  const [indicator, setIndicator] = React.useState<{ left: number; width: number }>({ left: 0, width: 0 })

  const recalc = React.useCallback(() => {
    const el = btnRefs.current[current]
    const wrap = containerRef.current
    if (!el || !wrap) return
    const eb = el.getBoundingClientRect()
    const wb = wrap.getBoundingClientRect()
    setIndicator({ left: eb.left - wb.left, width: eb.width })
  }, [current])

  React.useEffect(() => {
    // nach Layout
    const id = requestAnimationFrame(recalc)
    return () => cancelAnimationFrame(id)
  }, [recalc, ranges.length, size])

  React.useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(() => recalc())
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [recalc])

  // Nur den einen Param ersetzen, restliche Query erhalten
  const navigateTo = React.useCallback(
    (next: Key) => {
      const params = new URLSearchParams(search.toString())
      params.set(param, next)
      const url = `${pathname}?${params.toString()}`
      router.replace(url, { scroll: false })
    },
    [router, pathname, search, param]
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = keys.indexOf(current)
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = keys[Math.min(keys.length - 1, idx + 1)] as Key
      if (next !== current) navigateTo(next)
      btnRefs.current[next]?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const next = keys[Math.max(0, idx - 1)] as Key
      if (next !== current) navigateTo(next)
      btnRefs.current[next]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      const next = keys[0] as Key
      if (next !== current) navigateTo(next)
      btnRefs.current[next]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      const next = keys[keys.length - 1] as Key
      if (next !== current) navigateTo(next)
      btnRefs.current[next]?.focus()
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative inline-flex items-center rounded-xl border border-border bg-background/60 p-1 shadow-sm',
        h,
        className
      )}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
    >
      {/* Indicator */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-1 z-0 rounded-lg bg-primary',
          'transition-[left,width] duration-200 ease-out'
        )}
        style={{ left: `${indicator.left}px`, width: `${indicator.width}px` }}
      />

      {ranges.map((r) => {
        const active = r.key === current
        return (
          <button
            key={r.key}
            ref={refFor(r.key)}          // <-- fix: void callback
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            title={r.title}
            className={cn(
              'relative z-10 whitespace-nowrap rounded-lg outline-none transition',
              pad,
              active
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
            )}
            onClick={() => navigateTo(r.key)}
            type="button"
          >
            {r.label}
          </button>
        )
      })}
    </div>
  )
}
