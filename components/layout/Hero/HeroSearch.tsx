// components/layout/Hero/HeroSearch.tsx
'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import type { HeroMegaSearchProps } from '@/components/search/HeroMegaSearch'

type Props = {
  defaultQuery?: string
  region?: string
  className?: string
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

export default function HeroSearch({ defaultQuery, region, className }: Props) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = React.useState(false)

  // Mount-on-visible
  React.useEffect(() => {
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
  }, [])

  // Idle-prefetch
  React.useEffect(() => {
    const idle =
      'requestIdleCallback' in window
        ? (cb: () => void) => (window as any).requestIdleCallback(cb, { timeout: 1500 })
        : (cb: () => void) => setTimeout(cb, 300)
    idle(() => {
      import('@/components/search/HeroMegaSearch').catch(() => {})
    })
  }, [])

  // Shortcuts: "/" oder Cmd/Ctrl+K
  React.useEffect(() => {
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
  }, [])

  return (
    <div
      ref={wrapRef}
      className={cn('relative z-20 w-full px-4 sm:px-6 md:px-8', className)}
      data-default-query={defaultQuery ?? ''}
      data-region={region ?? ''}
    >
      {inView ? (
        <HeroMegaSearch initialTab="flight" />
      ) : (
        <div className="mx-auto w-full max-w-6xl rounded-3xl border border-white/10 bg-[#0c1930] p-6 text-white/80 shadow-2xl ring-1 ring-black/5">
          <div className="h-8 w-40 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 h-24 animate-pulse rounded-2xl bg-white/10" />
        </div>
      )}

      <noscript>
        <form
          action="/search"
          method="get"
          className="mx-auto mt-3 w-full max-w-6xl rounded-2xl bg-white/95 p-3 text-sm shadow"
        >
          <label className="sr-only" htmlFor="hero-noscript-q">Suche</label>
          <input
            id="hero-noscript-q"
            name="q"
            defaultValue={defaultQuery}
            placeholder="Suchen…"
            className="w-full rounded-lg border px-3 py-2"
          />
        </form>
      </noscript>

      <span className="sr-only">Tipp: „/“ oder ⌘/Ctrl+K fokussiert die Suche.</span>
    </div>
  )
}
