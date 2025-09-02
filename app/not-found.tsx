// app/not-found.tsx
'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  ArrowLeft,
  Home,
  Search as SearchIcon,
  Compass,
  Mail,
  Bug,
} from 'lucide-react'

export default function NotFound() {
  const router = useRouter()
  const pathname = usePathname()
  const [q, setQ] = useState('')

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const needle = q.trim()
    router.push(`/search?${new URLSearchParams(needle ? { q: needle } : {})}`)
  }

  return (
    <main className="relative min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl text-center">
        {/* Headline */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center rounded-2xl px-3 py-1 text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
            404 • Not Found
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
            Oops – Seite nicht gefunden
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Die angeforderte Adresse&nbsp;
            <code className="rounded bg-muted px-1.5 py-0.5 text-foreground/90">{pathname}</code>
            &nbsp;ist nicht verfügbar.
          </p>
        </div>

        {/* Suche */}
        <form
          onSubmit={onSearch}
          className="mx-auto mt-6 max-w-xl flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-e1"
          role="search"
          aria-label="Seite durchsuchen"
        >
          <SearchIcon className="ml-1 h-5 w-5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Wonach suchst du?"
            className="flex-1 bg-transparent px-2 py-2 text-sm outline-none"
            aria-label="Suchbegriff"
          />
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white btn-premium"
          >
            Suchen
          </button>
        </form>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm hover:bg-muted/40"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm hover:bg-muted/40"
            aria-label="Zur Startseite"
          >
            <Home className="h-4 w-4" />
            Startseite
          </Link>
          <a
            href={`mailto:support@jetnity.com?subject=404%20gemeldet&body=Die%20Seite%20${encodeURIComponent(pathname)}%20wurde%20nicht%20gefunden.`}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm hover:bg-muted/40"
          >
            <Mail className="h-4 w-4" />
            Problem melden
          </a>
        </div>

        {/* Quick Links */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/feed"
            className="surface-1 group flex items-center gap-3 rounded-2xl p-4 text-left transition hover:shadow-e2"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">Zum Feed</div>
              <div className="text-sm text-muted-foreground">Neueste Stories entdecken</div>
            </div>
          </Link>

          <Link
            href="/blog"
            className="surface-1 group flex items-center gap-3 rounded-2xl p-4 text-left transition hover:shadow-e2"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Bug className="h-5 w-5 rotate-180" />
            </div>
            <div>
              <div className="font-semibold">Zum Blog</div>
              <div className="text-sm text-muted-foreground">News, Guides & Updates</div>
            </div>
          </Link>
        </div>

        {/* Footer-Hinweis */}
        <p className="mt-10 text-xs text-muted-foreground">
          Tipp: Nutze die Suche oben oder gehe zurück zur Startseite. Wenn du der Meinung bist, dass das ein Fehler ist, melde dich kurz bei uns – danke!
        </p>
      </div>
    </main>
  )
}
