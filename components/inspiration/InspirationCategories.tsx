// components/inspiration/InspirationCategories.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Item = {
  title: string
  image: string
  link: string
  subtitle?: string
}

type Props = {
  items?: Item[]
  title?: string
  subtitle?: string
  className?: string
  gridClassName?: string
}

const DEFAULT_ITEMS: Item[] = [
  { title: 'Abenteuer', image: '/images/inspiration-adventure.jpg', link: '/reiseideen/abenteuer', subtitle: 'Jetzt entdecken →' },
  { title: 'Romantik',  image: '/images/inspiration-romantik.jpg',  link: '/reiseideen/romantik',  subtitle: 'Jetzt entdecken →' },
  { title: 'Citytrip',  image: '/images/inspiration-city.jpg',      link: '/reiseideen/citytrip',  subtitle: 'Jetzt entdecken →' },
  { title: 'Natur',     image: '/images/inspiration-natur.jpg',     link: '/reiseideen/natur',     subtitle: 'Jetzt entdecken →' },
]

export default function InspirationCategories({
  items = DEFAULT_ITEMS,
  title = 'Inspiration entdecken',
  subtitle,
  className,
  gridClassName,
}: Props) {
  return (
    <section className={cn('py-10 px-4 md:px-8', className)}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </header>

        <div
          className={cn(
            'grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4',
            gridClassName
          )}
        >
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.link}
              prefetch={false}
              aria-label={`${item.title} – öffnen`}
              className="group relative block overflow-hidden rounded-2xl border border-border bg-card shadow-e1 transition hover:-translate-y-0.5 hover:shadow-e3"
            >
              <div className="relative aspect-[16/10] bg-muted">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  priority={false}
                />
                {/* Overlay */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent opacity-90 transition group-hover:opacity-100" />
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 z-10 p-3 md:p-4 text-white">
                <div className="text-lg font-semibold drop-shadow">{item.title}</div>
                <div className="text-sm opacity-90">{item.subtitle ?? 'Mehr ansehen →'}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
