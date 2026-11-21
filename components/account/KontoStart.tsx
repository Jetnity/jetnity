import type { Route } from 'next'
import Link from 'next/link'
import { ChevronRight, Fingerprint, FolderLock, Heart, UserRound, UsersRound } from 'lucide-react'

import PersoenlicherReiseeinstieg from '@/components/account/PersoenlicherReiseeinstieg'
import { Karte } from '@/components/ui/karte'
import { Seitenkopf } from '@/components/ui/seitenkopf'

const bereiche = [
  { href: '/account/merkliste', name: 'Meine Merkliste', text: 'Gemerkte Angebote wiederfinden und planen', icon: Heart },
  { href: '/account/travellers', name: 'Reisende verwalten', text: 'Dein Reiseprofil und deine Mitreisenden', icon: UsersRound },
  { href: '/account/security', name: 'Anmeldung & Sicherheit', text: 'Passwort, Zwei-Faktor-Anmeldung und Sitzung', icon: Fingerprint },
  { href: '/account/settings#account-datenexport-title', name: 'Daten & Datenschutz', text: 'Kontodaten exportieren und Konto verwalten', icon: FolderLock },
] as const

/** Startseite des Kontos: nächster Reiseschritt zuerst, darunter Profil und Verwaltung. */
export default function KontoStart({ name, email, initiale }: { name: string; email: string | null; initiale: string | null }) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
      <Seitenkopf kicker="Konto" titel="Dein Jetnity" className="mb-6" />
      <PersoenlicherReiseeinstieg />
      <h2 className="mb-4 mt-10 text-title text-foreground">Dein Konto</h2>
      <Karte as="section" aria-label="Kontoprofil" className="overflow-hidden">
        <div className="flex min-w-0 items-center gap-4 px-5 py-5 sm:px-8">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-muted text-xl font-semibold text-foreground">
            {initiale ? initiale : <UserRound className="h-5 w-5" aria-hidden="true" />}
          </span>
          <div className="min-w-0">
            {name ? <p className="break-words text-subtitle text-foreground">{name}</p> : null}
            {email ? <p className="break-all text-meta text-muted-foreground">{email}</p> : null}
          </div>
        </div>
        <nav aria-label="Konto verwalten" className="divide-y divide-border border-t border-border">
          {bereiche.map(({ href, name: titel, text, icon: Icon }) => (
            <Link key={href} href={href as Route} className="group flex min-h-20 items-center gap-4 px-5 py-4 outline-offset-[-3px] transition-colors hover:bg-muted motion-reduce:transition-none sm:px-8">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-muted text-foreground"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><strong className="block text-body font-semibold text-foreground">{titel}</strong><span className="mt-0.5 block text-meta text-muted-foreground">{text}</span></span>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </Karte>
    </main>
  )
}
