'use client'

// components/layout/PublicNavbar.tsx
//
// Die öffentliche Leiste. Sie kennt die Sitzung.
//
// ---------------------------------------------------------------------------
// Warum die Sitzung im Browser gelesen wird und nicht im Layout
// ---------------------------------------------------------------------------
//
// Ein `createServerComponentClient()` in `app/(public)/layout.tsx` wäre der
// kürzere Weg – und würde jede öffentliche Seite dynamisch machen, weil das
// Layout dann Cookies liest. Die Startseite ist Marketing und soll statisch
// bleiben.
//
// Diese Komponente ist ohnehin ein Client Component (Menü, aktiver Pfad). Sie
// liest die Sitzung deshalb selbst: `getSession()` von `@supabase/ssr` schaut
// dafür in die Cookies, die der Server gesetzt hat, und geht nicht ins Netz.
// `onAuthStateChange` hält den Stand nach – eine Anmeldung in einem anderen Tab
// oder ein Abmelden erreichen die Leiste damit ohne Neuladen.
//
// Sicherheit: Was die Leiste zeigt, ist eine Anzeige und keine Berechtigung.
// Über Zugriff entscheiden weiterhin Middleware, Server Components und RLS.
//
// ---------------------------------------------------------------------------
// Warum nach dem Abmelden erneut gelesen wird
// ---------------------------------------------------------------------------
//
// `signOutAction()` löscht die Cookies auf dem Server und leitet weiter. Die
// Leiste liegt im Layout und wird dabei nicht neu aufgebaut; `onAuthStateChange`
// schweigt, weil der Browser-Client nicht selbst abgemeldet hat. Ohne
// erneutes Lesen stünde nach dem Abmelden weiter „Abmelden“ da.
//
// Gelesen wird deshalb nach jedem Wechsel des Pfads und nach jedem
// abgeschlossenen Vorgang. Nicht angenommen: `getSession()` schaut jedes Mal in
// die Cookies, und nur was dort liegt, entscheidet – ein gescheitertes Abmelden
// darf nicht als beendete Sitzung erscheinen (`standAusSitzung`).

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { LogOut, Menu, X } from 'lucide-react'

import { signOutAction } from '@/app/auth/sign-out'
import GastCreateLink from '@/components/trips/GastCreateLink'
import {
  HAUPTNAVIGATION,
  sitzungseintraege,
  standAusSitzung,
  type Navigationseintrag,
  type Sitzungsstand,
} from '@/lib/auth/oeffentliche-navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function PublicNavbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [sitzung, setSitzung] = React.useState<Sitzungsstand>('unbekannt')

  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Ohne Supabase-Konfiguration – etwa in einer Vorschau ohne Umgebung – bleibt
  // der Stand `unbekannt`. Die Leiste behauptet dann nichts, statt die Seite mit
  // einer Ausnahme abzureissen.
  const clientHolen = () => {
    try {
      return createBrowserClient()
    } catch {
      return null
    }
  }

  const lebt = React.useRef(true)
  React.useEffect(() => {
    lebt.current = true
    return () => {
      lebt.current = false
    }
  }, [])

  const sitzungLesen = React.useCallback(async () => {
    const client = clientHolen()
    if (!client) return

    const { data } = await client.auth.getSession()
    if (lebt.current) setSitzung(standAusSitzung(Boolean(data.session)))
  }, [])

  // Nach jedem Wechsel des Pfads: Eine Anmeldung leitet auf `/reisen`, ein
  // Abmelden auf `/`. Beide erreichen die Leiste sonst nicht, weil das Layout
  // bestehen bleibt.
  React.useEffect(() => {
    void sitzungLesen()
  }, [pathname, sitzungLesen])

  // Eine Anmeldung in einem anderen Tab erreicht die Leiste ohne Neuladen.
  React.useEffect(() => {
    const client = clientHolen()
    if (!client) return

    const { data: beobachter } = client.auth.onAuthStateChange((_ereignis, aktuelleSitzung) => {
      if (lebt.current) setSitzung(standAusSitzung(Boolean(aktuelleSitzung)))
    })

    return () => beobachter.subscription.unsubscribe()
  }, [])

  const isActive = (href: string) => {
    if (href === '/reisen') return pathname === '/reisen' || pathname.startsWith('/reisen/')
    if (href === '/account') return pathname === '/account' || pathname.startsWith('/account/')
    return false
  }

  // Sprungmarken wie /#entdecken aendern den Pfad nicht, das Menue muss sich
  // trotzdem schliessen, damit das Ziel sichtbar wird.
  const closeMobile = () => setMobileOpen(false)

  const eintraege = sitzungseintraege(sitzung)

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
          {HAUPTNAVIGATION.map((item) => (
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
          {eintraege.map((eintrag) => (
            <Sitzungseintrag key={eintrag.label} eintrag={eintrag} onNachlesen={sitzungLesen} />
          ))}
          <GastCreateLink
            createHref="/planen"
            createLabel="Reise planen"
            className="inline-flex min-h-11 items-center rounded-full bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-900 pointer-fine:min-h-0"
          />
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
            {HAUPTNAVIGATION.map((item) => (
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
            {eintraege.map((eintrag) => (
              <Sitzungseintrag
                key={eintrag.label}
                eintrag={eintrag}
                mobil
                onFertig={closeMobile}
                onNachlesen={sitzungLesen}
              />
            ))}
            <GastCreateLink
              createHref="/planen"
              createLabel="Reise planen"
              onClick={closeMobile}
              className="flex h-11 items-center justify-center rounded-full bg-brand-800 px-3 text-center text-sm font-semibold text-white"
            />
          </div>
        </nav>
      )}
    </header>
  )
}

/**
 * Ein sitzungsabhängiger Eintrag: Link oder Vorgang.
 *
 * Der Vorgang ist ein Formular auf `signOutAction()`. Die Server Action löscht
 * die Sitzungscookies und leitet auf die Startseite – ein Abmelden im Browser
 * allein liesse die Cookies des Servers stehen.
 */
function Sitzungseintrag({
  eintrag,
  mobil = false,
  onFertig,
  onNachlesen,
}: {
  eintrag: Navigationseintrag
  mobil?: boolean
  onFertig?: () => void
  onNachlesen: () => void
}) {
  if (eintrag.art === 'link') {
    return mobil ? (
      <Link
        href={eintrag.href}
        onClick={onFertig}
        className="flex h-11 items-center justify-center rounded-full border border-line-200 bg-white px-3 text-center text-sm font-semibold text-brand-800"
      >
        {eintrag.label}
      </Link>
    ) : (
      <Link
        href={eintrag.href}
        className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold text-ink-900 transition hover:bg-white pointer-fine:min-h-0"
      >
        {eintrag.label}
      </Link>
    )
  }

  return (
    <form action={signOutAction} className={mobil ? 'contents' : undefined}>
      <AbmeldenKnopf
        label={eintrag.label}
        mobil={mobil}
        onFertig={onFertig}
        onNachlesen={onNachlesen}
      />
    </form>
  )
}

/**
 * Der Knopf im Formular – und die Stelle, die den Abschluss des Vorgangs merkt.
 *
 * `useFormStatus` gilt nur innerhalb des Formulars, deshalb ist das eine eigene
 * Komponente. Sobald der Vorgang von „läuft“ auf „fertig“ wechselt, liest die
 * Leiste die Sitzung erneut. Der Weg über den Server ist nötig, weil ein
 * Abmelden im Browser die Cookies des Servers stehen liesse – die Leiste erfährt
 * davon aber nur, wenn sie danach selbst nachsieht.
 */
function AbmeldenKnopf({
  label,
  mobil,
  onFertig,
  onNachlesen,
}: {
  label: string
  mobil: boolean
  onFertig?: () => void
  onNachlesen: () => void
}) {
  const { pending } = useFormStatus()
  const lief = React.useRef(false)

  React.useEffect(() => {
    if (pending) {
      lief.current = true
      return
    }
    if (lief.current) {
      lief.current = false
      onNachlesen()
    }
  }, [pending, onNachlesen])

  return (
    <button
      type="submit"
      onClick={onFertig}
      className={
        mobil
          ? 'flex h-11 w-full items-center justify-center gap-2 rounded-full border border-line-200 bg-white px-3 text-center text-sm font-semibold text-brand-800'
          : 'inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-ink-900 transition hover:bg-white pointer-fine:min-h-0'
      }
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  )
}
