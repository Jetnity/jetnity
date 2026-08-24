import Link from 'next/link'
import { ArrowUpRight, Mail } from 'lucide-react'

import FooterSitzung from '@/components/layout/FooterSitzung'

const productLinks = [
  { label: 'Reise planen', href: '/planen' },
  { label: 'Meine Reisen', href: '/reisen' },
  { label: 'Entdecken', href: '/#entdecken' },
  { label: 'Jetnity Pro', href: '/#pro' },
]

/**
 * Auf Touch-Geraeten stehen die Links weiter auseinander und bekommen eine
 * bequeme Trefferhoehe. Mit Maus bleibt die kompakte Fussleiste unveraendert.
 */
const footerListClass = 'mt-5 space-y-1 pointer-fine:mt-5 pointer-fine:space-y-3'
const footerLinkClass =
  'inline-flex min-h-10 items-center text-sm text-white/70 transition hover:text-white pointer-fine:min-h-0'

export default function Footer() {
  return (
    <footer
      className="bg-brand-900 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]
                 pr-[env(safe-area-inset-right)] text-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_0.6fr_0.6fr]">
          <div className="max-w-md">
            <Link
              href="/"
              className="-mx-2 inline-flex min-h-11 items-center gap-2.5 px-2"
              aria-label="Jetnity Startseite"
            >
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <span className="h-2.5 w-2.5 rotate-45 rounded-[3px] bg-citrus-400" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              <span className="text-xl font-bold tracking-[-0.04em]">Jetnity</span>
            </Link>
            <p className="mt-5 text-sm leading-6 text-white/65">
              Deine ganze Reise – persönlich geplant, übersichtlich organisiert und intelligent begleitet.
            </p>
            <a
              href="mailto:info@jetnity.ch"
              className="-mx-2 mt-4 inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-citrus-400 hover:text-white"
            >
              <Mail className="h-4 w-4 shrink-0" />
              info@jetnity.ch
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            </a>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Produkt</h2>
            <ul className={footerListClass}>
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={footerLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Jetnity</h2>
            <ul className={footerListClass}>
              <FooterSitzung />
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row">
          <p>© {new Date().getFullYear()} Jetnity. Alle Rechte vorbehalten.</p>
          <p>
            Ortsdaten:{' '}
            <a
              href="https://www.geonames.org/"
              className="underline decoration-white/25 underline-offset-2 hover:text-white"
            >
              GeoNames
            </a>{' '}
            (CC BY 4.0)
          </p>
        </div>
      </div>
    </footer>
  )
}
