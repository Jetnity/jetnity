import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Mail } from 'lucide-react'

import FooterSitzung from '@/components/layout/FooterSitzung'
import { PrivacyBeeCmpPreferences } from '@/components/privacy/PrivacyBeeCmpPreferences'
import GastCreateLink from '@/components/trips/GastCreateLink'

const productLinks = [
  { label: 'Reise planen', href: '/planen' },
  { label: 'Meine Reisen', href: '/reisen' },
  { label: 'Entdecken', href: '/entdecken' },
  { label: 'Jetnity Pro', href: '/#pro' },
]

/**
 * Auf Touch-Geraeten stehen die Links weiter auseinander und bekommen eine
 * bequeme Trefferhoehe. Mit Maus bleibt die kompakte Fussleiste unveraendert.
 */
const footerListClass = 'mt-5 min-w-0 space-y-1 pointer-fine:mt-5 pointer-fine:space-y-3'
const footerLinkClass =
  'inline-flex min-h-11 min-w-0 max-w-full items-center text-sm text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 pointer-fine:min-h-0'

export default function Footer() {
  return (
    <footer
      className="bg-brand-900 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]
                 pr-[env(safe-area-inset-right)] text-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-14 [overflow-wrap:anywhere] sm:px-8 sm:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)_minmax(0,0.6fr)]">
          <div className="min-w-0 max-w-md">
            <Link
              href="/"
              className="-mx-2 inline-flex min-h-11 min-w-0 max-w-full items-center px-3 py-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
              aria-label="Jetnity Startseite"
            >
              {/* Dasselbe offizielle PNG. Nur diese Footer-Darstellung wird reinweiß; Geometrie und Asset bleiben. */}
              <Image
                src="/brand/jetnity-logo.png"
                alt=""
                width={384}
                height={128}
                unoptimized
                sizes="144px"
                className="h-[48px] w-auto max-w-full object-contain brightness-0 invert"
                style={{ width: 'auto', height: '48px' }}
              />
            </Link>
            <p className="mt-5 text-sm leading-6 text-white/65">
              Deine ganze Reise – persönlich geplant, übersichtlich organisiert und intelligent begleitet.
            </p>
            <a
              href="mailto:info@jetnity.ch"
              className="-mx-2 mt-4 inline-flex min-h-11 min-w-0 max-w-full items-center gap-2 px-2 text-sm font-semibold text-citrus-400 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0">info@jetnity.ch</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </a>
          </div>

          <div className="min-w-0">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Produkt</h2>
            <ul className={footerListClass}>
              {productLinks.map((link) => (
                <li key={link.href}>
                  {link.href === '/planen' ? (
                    <GastCreateLink
                      createHref={link.href}
                      createLabel={link.label}
                      className={footerLinkClass}
                    />
                  ) : (
                    <Link href={link.href} className={footerLinkClass}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Jetnity</h2>
            <ul className={footerListClass}>
              <li>
                <Link href="/privacy" className={footerLinkClass}>
                  Datenschutzerklärung
                </Link>
              </li>
              <li>
                <Link href="/terms" className={footerLinkClass}>
                  Nutzungsbedingungen / AGB
                </Link>
              </li>
              <li>
                <Link href="/impressum" className={footerLinkClass}>
                  Impressum
                </Link>
              </li>
              <PrivacyBeeCmpPreferences appearance="footer" />
              <FooterSitzung />
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row">
          <p className="min-w-0">© {new Date().getFullYear()} Jetnity. Alle Rechte vorbehalten.</p>
          <p className="min-w-0">
            Ortsdaten:{' '}
            <a
              href="https://www.geonames.org/"
              className="inline-flex min-h-11 max-w-full items-center underline decoration-white/25 underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 pointer-fine:min-h-0"
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
