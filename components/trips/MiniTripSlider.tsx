// components/travel/MiniTripSlider.tsx
'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Trip = {
  title: string
  tags: string[]
  image?: string
  emoji?: string
  href?: string
}

const trips: Trip[] = [
  {
    title: '3 Tage in Lissabon',
    tags: ['Strand', 'Food', 'Kultur'],
    image: '/images/lisbon.jpg',
    emoji: '🌊',
    href: '/search?tab=discover&city=lisbon&mood=city&region=europa',
  },
  {
    title: 'Kurztrip: Amsterdam',
    tags: ['Fahrrad', 'Kunst', 'Kanal'],
    image: '/images/amsterdam.jpg',
    emoji: '🚲',
    href: '/search?tab=discover&city=amsterdam&mood=city&region=europa',
  },
  {
    title: 'Wandern in Zermatt',
    tags: ['Natur', 'Berge', 'Schweiz'],
    image: '/images/zermatt.jpg',
    emoji: '🏔️',
    href: '/search?tab=discover&city=zermatt&mood=mountain&region=alpen',
  },
  {
    title: 'City-Trip: Prag',
    tags: ['Altstadt', 'Architektur', 'Food'],
    image: '/images/prague.jpg',
    emoji: '🏛️',
    href: '/search?tab=discover&city=prague&mood=city&region=europa',
  },
  {
    title: 'Entspannung in Bali',
    tags: ['Strand', 'Yoga', 'Tropen'],
    image: '/images/bali.jpg',
    emoji: '🌴',
    href: '/search?tab=discover&region=bali&mood=relax',
  },
]

export default function MiniTripSlider() {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = React.useState(false)
  const [canRight, setCanRight] = React.useState(true)
  const [progress, setProgress] = React.useState(0)
  const [paused, setPaused] = React.useState(false)

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const update = React.useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanLeft(scrollLeft > 0)
    setCanRight(scrollLeft + clientWidth < scrollWidth - 1)
    setProgress(Math.min(1, Math.max(0, scrollLeft / (scrollWidth - clientWidth || 1))))
  }, [])

  React.useEffect(() => {
    update()
    const el = wrapRef.current
    if (!el) return
    const onScroll = () => update()
    el.addEventListener('scroll', onScroll, { passive: true })

    let ro: ResizeObserver | undefined
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      ro = new ResizeObserver(update)
      ro.observe(el)
    }

    return () => {
      el.removeEventListener('scroll', onScroll)
      ro?.disconnect()
    }
  }, [update])

  // Auto-Scroll mit Hover-Pause & „prefers-reduced-motion“
  React.useEffect(() => {
    if (reducedMotion) return
    const el = wrapRef.current
    if (!el) return

    let interval: number | undefined

    const tick = () => {
      if (paused) return
      const firstCard = el.querySelector<HTMLElement>('[data-card]')
      const gap = 20 // entspricht gap-5
      const step = (firstCard?.clientWidth || 300) + gap

      // am Ende zurückspringen
      if (Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' })
      }
    }

    interval = window.setInterval(tick, 4000)

    // Pause bei Interaktion
    const pause = () => setPaused(true)
    const resume = () => setPaused(false)
    el.addEventListener('mouseenter', pause)
    el.addEventListener('mouseleave', resume)
    el.addEventListener('pointerdown', pause)
    el.addEventListener('pointerup', resume)
    el.addEventListener('touchstart', pause, { passive: true })
    el.addEventListener('touchend', resume)

    return () => {
      if (interval) window.clearInterval(interval)
      el.removeEventListener('mouseenter', pause)
      el.removeEventListener('mouseleave', resume)
      el.removeEventListener('pointerdown', pause)
      el.removeEventListener('pointerup', resume)
      el.removeEventListener('touchstart', pause)
      el.removeEventListener('touchend', resume)
    }
  }, [paused, reducedMotion])

  const scrollByCards = (dir: 1 | -1) => {
    const el = wrapRef.current
    if (!el) return
    const firstCard = el.querySelector<HTMLElement>('[data-card]')
    const gap = 20
    const delta = (firstCard?.clientWidth || 300) + gap
    el.scrollBy({ left: dir * delta, behavior: 'smooth' })
  }

  return (
    <section aria-label="Mini-Reiseideen" className="relative bg-muted/20 py-8 sm:py-12">
      {/* Edge Fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-muted/20 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-muted/20 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Mini-Reiseideen</h2>
          {/* Progressbar */}
          <div className="hidden sm:block w-40 h-1 rounded-full bg-border relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width]"
              style={{ width: `${Math.max(8, progress * 100)}%` }}
            />
          </div>
        </div>

        <div className="relative">
          {/* Desktop-Pfeile */}
          <button
            type="button"
            aria-label="Nach links scrollen"
            onClick={() => scrollByCards(-1)}
            className={cn(
              'absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-border bg-card/80 p-2 shadow backdrop-blur-md transition hover:bg-card sm:inline-flex',
              !canLeft && 'opacity-50 cursor-not-allowed'
            )}
            disabled={!canLeft}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            ref={wrapRef}
            className={cn(
              'flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2',
              '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
            )}
          >
            {trips.map((t, i) => (
              <TripCard key={i} trip={t} />
            ))}
          </div>

          <button
            type="button"
            aria-label="Nach rechts scrollen"
            onClick={() => scrollByCards(1)}
            className={cn(
              'absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-border bg-card/80 p-2 shadow backdrop-blur-md transition hover:bg-card sm:inline-flex',
              !canRight && 'opacity-50 cursor-not-allowed'
            )}
            disabled={!canRight}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

function TripCard({ trip }: { trip: Trip }) {
  const [error, setError] = React.useState(false)

  return (
    <article
      data-card
      className={cn(
        'group relative w-[280px] sm:w-[300px] snap-start shrink-0',
        'transition-transform duration-300 will-change-transform',
        'hover:-translate-y-0.5'
      )}
    >
      {/* Gradient-Border */}
      <div className="rounded-3xl p-[1px] bg-gradient-to-b from-white/25 via-white/10 to-transparent">
        <div
          className={cn(
            'rounded-3xl border border-border bg-card/70 backdrop-blur-xl',
            'shadow-sm hover:shadow-xl transition-shadow'
          )}
        >
          {/* Media */}
          <div className="relative h-44 overflow-hidden rounded-t-3xl">
            {!error && trip.image ? (
              <Image
                src={trip.image}
                alt={trip.title}
                fill
                sizes="(max-width: 640px) 280px, 300px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                onError={() => setError(true)}
                priority={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/20 via-sky-400/15 to-emerald-400/20">
                <span className="text-5xl">{trip.emoji ?? '✈️'}</span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 to-black/10" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/80 to-transparent" />
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="text-[17px] font-semibold leading-snug text-foreground line-clamp-2">
              {trip.title}
            </h3>

            <div className="mt-2 flex flex-wrap gap-2">
              {trip.tags.map((tg) => (
                <span
                  key={tg}
                  className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {tg}
                </span>
              ))}
            </div>

            <div className="mt-3">
              <Link
                href={trip.href || '#'}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                aria-label={`${trip.title} entdecken`}
              >
                Jetzt entdecken <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
