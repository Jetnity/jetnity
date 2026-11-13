import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Fingerprint, FolderLock, UserRound, UsersRound } from 'lucide-react'

import PersoenlicherReiseeinstieg from '@/components/account/PersoenlicherReiseeinstieg'
import { begruessungName } from '@/lib/account/begruessung'
import { createServerComponentClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Dein Jetnity',
  description: 'Deine Reise fortsetzen, eine neue Reise beginnen und dein Konto verwalten.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const bereiche = [
  { href: '/account/travellers', name: 'Reisende verwalten', text: 'Dein Reiseprofil und deine Mitreisenden', icon: UsersRound },
  { href: '/account/security', name: 'Anmeldung & Sicherheit', text: 'Passwort, Zwei-Faktor-Anmeldung und Sitzung', icon: Fingerprint },
  { href: '/account/settings#account-datenexport-title', name: 'Daten & Datenschutz', text: 'Kontodaten exportieren und Konto verwalten', icon: FolderLock },
] as const

export default async function AccountSeite() {
  const supabase = await createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profilname = user?.user_metadata?.name ?? user?.user_metadata?.full_name
  const name = typeof profilname === 'string' ? profilname.trim() : ''

  const initiale = begruessungName({ name, email: user?.email })?.slice(0, 1).toLocaleUpperCase('de-CH')

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 sm:py-14">
      <h1 className="mb-6 text-3xl font-semibold tracking-[-0.045em] text-brand-800 sm:text-5xl">Dein Jetnity</h1>
      <PersoenlicherReiseeinstieg />
      <h2 className="mb-4 mt-10 text-xl font-semibold tracking-tight text-brand-800">Dein Konto</h2>
      <section aria-label="Kontoprofil" className="flex min-w-0 items-center gap-4 rounded-t-[26px] bg-brand-800 px-5 py-7 text-white sm:gap-6 sm:px-8">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 text-2xl font-semibold">
          {initiale ? initiale : <UserRound aria-hidden="true" />}
        </span>
        <div className="min-w-0">
          {name ? <h2 className="break-words text-2xl font-semibold tracking-tight">{name}</h2> : null}
          {user?.email ? <p className="break-all text-sm text-white/90">{user.email}</p> : null}
        </div>
      </section>
      <nav aria-label="Konto verwalten" className="divide-y divide-line-100 overflow-hidden rounded-b-[26px] border border-t-0 border-line-200 bg-white">
        {bereiche.map(({ href, name: titel, text, icon: Icon }) => (
          <Link key={href} href={href} className="group flex min-h-20 items-center gap-4 px-5 py-5 outline-offset-[-3px] hover:bg-surface-50 sm:px-8">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-100 text-brand-800"><Icon className="h-5 w-5" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><strong className="block text-base text-brand-800">{titel}</strong><span className="mt-1 block text-sm text-ink-700">{text}</span></span>
            <ChevronRight className="h-5 w-5 shrink-0 text-ink-600" aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </main>
  )
}
