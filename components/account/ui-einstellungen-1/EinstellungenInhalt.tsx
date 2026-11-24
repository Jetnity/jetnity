'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Shield } from 'lucide-react'
import KontoDatenexportAktion from '@/components/account/account-home-export-1/KontoDatenexportAktion'
import KontoLoeschen from '@/components/account/KontoLoeschen'
import Kontosprache, { type KontospracheAktionen } from './Kontosprache'
import ArbeitsbereichDarstellung from './ArbeitsbereichDarstellung'
import type { UiEinstellungenLesen } from '@/lib/account/ui-einstellungen-1/vertrag'
import type { UiSprache } from '@/lib/localization/ui-sprache'
import { einstellungenText } from '@/lib/localization/einstellungen-texte'
import { Seitenkopf } from '@/components/ui/seitenkopf'
import { cn } from '@/lib/utils'

type Eigenschaften = KontospracheAktionen & {
  initial: UiEinstellungenLesen
  bereich: 'konto' | 'admin'
  loeschungAngeboten?: boolean
}

function Inhalt({ initial, bereich, loeschungAngeboten = false, ...aktionen }: Eigenschaften) {
  const [sprache, setSprache] = useState<UiSprache>(initial.status === 'bereit' ? initial.sprache : 'de')
  const loeschBereich = loeschungAngeboten ? <KontoLoeschen sprache={sprache} /> : null
  const titelPraefix = bereich === 'admin' ? 'admin' : 'account'
  return (
    <div lang={sprache} data-einstellungen-hub="" className={cn('min-w-0 [overflow-wrap:anywhere]', bereich === 'konto' && 'px-4 py-6 sm:px-6 sm:py-8')}>
      <div className="mx-auto max-w-5xl">
        <Seitenkopf kicker={einstellungenText(sprache, `${titelPraefix}.eyebrow`)} titel={einstellungenText(sprache, `${titelPraefix}.title`)}>
          <p>{einstellungenText(sprache, `${titelPraefix}.intro`)}</p>
        </Seitenkopf>
        <Kontosprache initial={initial} sprache={sprache} waehlen={setSprache} bereich={bereich} {...aktionen} />
        {bereich === 'admin' ? <p className="mt-4 max-w-prose text-sm leading-6 text-foreground/80">{einstellungenText(sprache, 'admin.scope')}</p> : (
          <>
            <ArbeitsbereichDarstellung sprache={sprache} />
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Link href="/account/security" className="flex min-h-11 flex-col gap-4 rounded-card border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-raised focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 motion-reduce:transition-none sm:flex-row sm:items-start sm:p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-muted text-foreground"><Shield className="h-5 w-5" aria-hidden="true" /></span>
                <span className="min-w-0"><span className="block text-subtitle text-foreground">{einstellungenText(sprache, 'security.title')}</span><span className="mt-1 block text-meta text-muted-foreground">{einstellungenText(sprache, 'security.description')}</span></span>
              </Link>
              <section aria-labelledby="account-datenexport-title" className="min-w-0 rounded-card border border-border bg-card p-4 shadow-card sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-muted text-foreground"><Download className="h-5 w-5" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <h2 id="account-datenexport-title" className="text-subtitle text-foreground">{einstellungenText(sprache, 'export.title')}</h2>
                    <p className="mt-1 text-meta text-muted-foreground">{einstellungenText(sprache, 'export.description')}</p>
                    <p className="mt-3 text-meta text-muted-foreground">{einstellungenText(sprache, 'export.scope')}</p>
                    <p className="mt-3 text-meta text-muted-foreground">{einstellungenText(sprache, 'export.exclusion')}</p>
                    <KontoDatenexportAktion sprache={sprache} />
                  </div>
                </div>
              </section>
            </div>
            {loeschBereich ? <div className="mt-8 border-t border-red-200 pt-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-800">{einstellungenText(sprache, 'delete.danger')}</p><div className="mt-3">{loeschBereich}</div></div> : null}
          </>
        )}
      </div>
    </div>
  )
}

export default function EinstellungenInhalt(eigenschaften: Eigenschaften) {
  // Account replacement remounts drafts/status. Old responses cannot update
  // the new account's component instance.
  const key = eigenschaften.initial.status === 'bereit' ? eigenschaften.initial.benutzerId : eigenschaften.initial.status
  return <Inhalt key={key} {...eigenschaften} />
}
