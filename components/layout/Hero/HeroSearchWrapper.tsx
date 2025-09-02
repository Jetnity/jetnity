// components/layout/Hero/HeroSearchWrapper.tsx
'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import type { HeroMegaSearchProps, TabType } from '@/components/search/HeroMegaSearch'

type Props = {
  /** Optional: Start-Tab (z. B. "flight") */
  initialTab?: TabType
  /** Klassen für den äußeren Wrapper */
  className?: string
  /** Erst mounten, wenn sichtbar (spart JS) */
  mountWhenVisible?: boolean
  /** Tastenkürzel aktivieren: "/" oder ⌘/Ctrl+K fokussiert das Suchfeld */
  focusShortcut?: boolean
}

const HeroMegaSearch = dynamic<HeroMegaSearchProps>(
  () =>
    import('@/components/search/HeroMegaSearch').then((m) => 
      m.default as React.ComponentType<HeroMegaSearchProps>
    ),
  {
    ssr: false,
    loading: () => (
      <div
        aria-busy="true"
        aria-live="polite"
        className="mx-auto w-full max-w-6xl rounded-3xl border border-white/10 bg-[#0c1930] p-6 text-white/80 shadow-2xl ring-1 ring-black/5"
      >
        <div className="h-8 w-40 animate-pulse rounded-full bg-white/10" />
        <div className="mt-4 h-24 animate-pulse rounded-2xl bg-white/10" />
      </div>
    ),
  }
)

export default function HeroSearchWrapper({
  initialTab = 'flight',
  className,
  mountWhenVisible = true,
  focusShortcut = true,
}: Props) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = React.useState(!mountWhenVisible)

  // Sichtbarkeitsgesteuertes Mounten
  React.useEffect(() => {
    if (!mountWhenVisible) return
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '600px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [mountWhenVisible])

  // Idle-Prefetch der MegaSearch
  React.useEffect(() => {
    const idle =
      'requestIdleCallback' in window
        ? (cb: () => void) => (window as any).requestIdleCallback(cb, { timeout: 1500 })
        : (cb: () => void) => setTimeout(cb, 300)
    idle(() => {
      import('@/components/search/HeroMegaSearch').catch(() => {})
    })
  }, [])

  // Tastenkürzel zum Fokussieren
  React.useEffect(() => {
    if (!focusShortcut) return
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      const typing = !!t && (/(input|textarea|select)/i.test(t.tagName) || t.isContentEditable)
      const isSlash = e.key === '/'
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if ((isSlash || isCmdK) && !typing) {
        e.preventDefault()
        const root = wrapRef.current
        const input = root?.querySelector<HTMLInputElement>(
          '[data-hero-search-input], input[type="search"], input'
        )
        input?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusShortcut])

  return (
    <div ref={wrapRef} className={cn('relative z-10 w-full px-4', className)}>
      {inView ? (
        <HeroMegaSearch initialTab={initialTab} />
      ) : (
        <div className="mx-auto w-full max-w-6xl rounded-3xl border border-white/10 bg-[#0c1930] p-6 text-white/80 shadow-2xl ring-1 ring-black/5">
          <div className="h-8 w-40 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 h-24 animate-pulse rounded-2xl bg-white/10" />
        </div>
      )}
      <span className="sr-only">Tipp: „/“ oder ⌘/Ctrl+K fokussiert die Suche.</span>
    </div>
  )
}
