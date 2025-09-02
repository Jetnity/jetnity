// components/layout/Footer.tsx
import Link from 'next/link'
import { Instagram, Twitter, Youtube, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

type FooterLink = { label: string; href: string; external?: boolean; ariaLabel?: string }

const company: FooterLink[] = [
  { label: 'Über uns', href: '/about' },
  { label: 'Partnerprogramm', href: '/partners' },
  { label: 'Presse', href: '/press' },
]

const resources: FooterLink[] = [
  { label: 'Blog', href: '/blog' },
  { label: 'Hilfe & Support', href: '/help' },
  { label: 'Kontakt', href: '/contact' },
]

const legal: FooterLink[] = [
  { label: 'Datenschutz', href: '/legal/privacy' },
  { label: 'AGB', href: '/legal/terms' },
  { label: 'Impressum', href: '/legal/imprint' },
]

const socials: FooterLink[] = [
  { label: 'Instagram', href: 'https://instagram.com/', external: true, ariaLabel: 'Instagram öffnen' },
  { label: 'X (Twitter)', href: 'https://twitter.com/', external: true, ariaLabel: 'X öffnen' },
  { label: 'YouTube', href: 'https://youtube.com/', external: true, ariaLabel: 'YouTube öffnen' },
  { label: 'E-Mail', href: 'mailto:hello@jetnity.com', external: true, ariaLabel: 'E-Mail an Jetnity' },
]

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-white/90">{title}</h3>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            {l.external ? (
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={l.ariaLabel ?? l.label}
                className="text-sm text-white/80 hover:text-white underline-offset-4 hover:underline"
              >
                {l.label}
              </a>
            ) : (
              <Link
                href={l.href}
                aria-label={l.ariaLabel ?? l.label}
                className="text-sm text-white/80 hover:text-white underline-offset-4 hover:underline"
              >
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer({ className }: { className?: string }) {
  const year = new Date().getFullYear()

  return (
    <footer
      role="contentinfo"
      className={cn(
        'bg-neutral-950 text-white',
        'border-t border-white/10',
        className
      )}
    >
      <div className="mx-auto max-w-screen-xl px-6 py-12">
        {/* Top */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand + Newsletter */}
          <div className="sm:col-span-2">
            <Link
              href="/"
              aria-label="Startseite"
              className="inline-block text-lg font-extrabold tracking-tight"
            >
              Jetnity
            </Link>
            <p className="mt-2 max-w-sm text-sm text-white/70">
              Reisen, die zu dir passen – Flüge, Hotels & Aktivitäten auf einer smarten Plattform.
            </p>

            {/* Newsletter (ohne Client-JS) */}
            <form
              action="/newsletter"
              method="post"
              className="mt-4 flex max-w-sm gap-2"
              aria-label="Newsletter anmelden"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                E-Mail Adresse
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                required
                placeholder="E-Mail"
                className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 outline-none ring-0 transition focus:border-white/30"
              />
              <button
                type="submit"
                className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black hover:brightness-95"
              >
                Anmelden
              </button>
            </form>

            {/* Socials */}
            <div className="mt-4 flex items-center gap-3">
              {socials.map((s) => {
                const Icon =
                  s.label.startsWith('Instagram')
                    ? Instagram
                    : s.label.startsWith('X')
                    ? Twitter
                    : s.label.startsWith('YouTube')
                    ? Youtube
                    : Mail
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target={s.external ? '_blank' : undefined}
                    rel={s.external ? 'noopener noreferrer' : undefined}
                    aria-label={s.ariaLabel ?? s.label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Link-Spalten */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-10 sm:gap-6">
            <FooterCol title="Unternehmen" links={company} />
            <FooterCol title="Ressourcen" links={resources} />
            <FooterCol title="Rechtliches" links={legal} />
            <div>
              <h3 className="mb-3 text-sm font-semibold tracking-wide text-white/90">App</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/download" className="text-white/80 hover:text-white underline-offset-4 hover:underline">
                    Download
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="text-white/80 hover:text-white underline-offset-4 hover:underline">
                    Systemstatus
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/60">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p>© {year} Jetnity — Alle Rechte vorbehalten.</p>
            <div className="flex items-center gap-4">
              <Link href="/sitemap" className="hover:text-white">Sitemap</Link>
              <Link href="/cookies" className="hover:text-white">Cookie-Einstellungen</Link>
              <a href="/legal/privacy" className="hover:text-white">Datenschutz</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
