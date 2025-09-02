// app/(public)/not-found.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Home, Compass, MapPin, Sparkles } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()
  const [q, setQ] = React.useState('')

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    const query = q.trim()
    if (query.length === 0) return
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  const chips = [
    'Bali', 'Lissabon', 'Zermatt', 'Athen', 'Amsterdam', 'Kyoto',
    'Marrakesch', 'Patagonien', 'Chiang Mai', 'Sardinien',
  ]

  const quickLinks: Array<{ href: string; title: string; desc: string; icon: React.ComponentType<any> }> = [
    { href: '/', title: 'Startseite', desc: 'Zurück zum Anfang', icon: Home },
    { href: '/search?sort=recent', title: 'Entdecken', desc: 'Neue Uploads & Ideen', icon: Compass },
    { href: '/inspiration', title: 'Inspirationen', desc: 'Kuratiert für dich', icon: Sparkles },
    { href: '/blog', title: 'Blog', desc: 'Guides & Stories', icon: MapPin },
  ]

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-16">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
          <Compass className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Seite nicht gefunden</h1>
        <p className="mt-2 text-muted-foreground">
          Die angeforderte Seite existiert nicht (404) oder wurde verschoben. Probiere die Suche
          oder entdecke unsere beliebtesten Ziele.
        </p>
      </div>

      {/* Suche */}
      <form onSubmit={onSubmit} className="mx-auto mb-10 flex w-full max-w-2xl items-stretch gap-2">
        <div className="relative flex-1">
          <label htmlFor="search" className="sr-only">Suche</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" aria-hidden="true" />
          <input
            id="search"
            name="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ziel, Thema oder Creator suchen…"
            className="h-12 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-base outline-none ring-offset-background
                       focus:ring-2 focus:ring-primary/60"
            autoComplete="off"
            aria-describedby="search-help"
          />
          <p id="search-help" className="mt-2 text-xs text-muted-foreground">
            Beispiele: &quot;Zermatt Winter&quot;, &quot;Kyoto Food&quot;, &quot;Bali Strände&quot;
          </p>
        </div>
        <button
          type="submit"
          className="h-12 shrink-0 rounded-xl border border-border bg-primary px-4 font-medium text-primary-foreground transition hover:opacity-90"
        >
          Suchen
        </button>
      </form>

      {/* Beliebte Ziele */}
      <section aria-labelledby="popular-chips-title" className="mb-10">
        <h2 id="popular-chips-title" className="mb-3 text-sm font-medium text-muted-foreground">Beliebte Suchen</h2>
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => router.push(`/search?q=${encodeURIComponent(c)}`)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Schnelllinks */}
      <section aria-labelledby="quicklinks-title">
        <h2 id="quicklinks-title" className="mb-3 text-sm font-medium text-muted-foreground">Schnelllinks</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickLinks.map(({ href, title, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group relative rounded-2xl border border-border bg-card p-5 transition hover:shadow-md"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="mb-1 text-lg font-semibold">{title}</div>
              <p className="text-sm text-muted-foreground">{desc}</p>
              <div className="pointer-events-none absolute right-4 top-5 text-xs opacity-0 transition group-hover:opacity-100">
                Weiter →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer-Aktion */}
      <div className="mt-12 flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 transition hover:bg-accent hover:text-accent-foreground"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Zur Startseite
        </Link>
        <Link
          href="/search?sort=recent"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 transition hover:bg-accent hover:text-accent-foreground"
        >
          <Compass className="h-4 w-4" aria-hidden="true" />
          Entdecken
        </Link>
      </div>
    </main>
  )
}
