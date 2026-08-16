'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

import { cn } from '@/lib/utils'

const navigation = [
  { label: 'Entdecken', href: '/#entdecken' },
  { label: 'Meine Reisen', href: '/reisen' },
  { label: 'Jetnity Pro', href: '/#pro' },
]

export default function PublicNavbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isActive = (href: string) =>
    href === '/reisen' && (pathname === '/reisen' || pathname.startsWith('/reisen/'))

  // Sprungmarken wie /#entdecken aendern den Pfad nicht, das Menue muss sich
  // trotzdem schliessen, damit das Ziel sichtbar wird.
  const closeMobile = () => setMobileOpen(false)

  return (
    <header
      className="sticky top-0 z-50 border-b border-black/5 bg-surface-75/95 pl-[env(safe-area-inset-left)]
                 pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          aria-label="Jetnity Startseite"
          className="-mx-2 inline-flex min-h-11 items-center gap-2.5 px-2 text-brand-800"
        >
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-800 shadow-sm">
            <span className="h-2.5 w-2.5 rotate-45 rounded-[3px] bg-citrus-400" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          <span className="text-lg font-bold tracking-[-0.04em]">Jetnity</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Hauptnavigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                // Ab md sichtbar, auf Tablets also weiterhin per Finger bedient:
                // volle Trefferhoehe auf Touch-Geraeten, kompakte Pille mit Maus.
                'inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-medium transition pointer-fine:min-h-0',
                isActive(item.href)
                  ? 'bg-surface-100 text-brand-800'
                  : 'text-ink-800 hover:bg-white hover:text-brand-800'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold text-ink-900 transition hover:bg-white pointer-fine:min-h-0"
          >
            Anmelden
          </Link>
          <Link
            href="/planen"
            className="inline-flex min-h-11 items-center rounded-full bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-900 pointer-fine:min-h-0"
          >
            Reise planen
          </Link>
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((current) => !current)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-200 bg-white text-brand-800 md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-black/5 bg-surface-75 px-5 py-4 md:hidden"
        >
          <div className="grid gap-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-ink-900 hover:bg-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line-200 pt-4">
            <Link
              href="/login"
              onClick={closeMobile}
              className="flex h-11 items-center justify-center rounded-full border border-line-200 bg-white px-3 text-center text-sm font-semibold text-brand-800"
            >
              Anmelden
            </Link>
            <Link
              href="/planen"
              onClick={closeMobile}
              className="flex h-11 items-center justify-center rounded-full bg-brand-800 px-3 text-center text-sm font-semibold text-white"
            >
              Reise planen
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
