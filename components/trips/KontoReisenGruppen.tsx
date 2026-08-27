'use client'

// components/trips/KontoReisenGruppen.tsx
//
// Ableitende Gruppen für Kontoreisen. Klassifikation erst am Geräte-Kalendertag.
// Archivfilter ist von der date-only-Lage getrennt. Kein Workspace, keine
// verschachtelten Aktionen in der Reisekarte.

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { heutigesDatum } from '@/lib/account/naechste-reise'
import { archivierteReisenAus, kontoReisenSichten, offeneReisenAus } from '@/lib/account/reise-archiv'
import { reisePasstZurSuche, type ReiseGruppen } from '@/lib/account/reise-lage'
import { REISEN_LISTE_GRENZE } from '@/lib/trips/liste-grenze'
import KontoReiseEintrag from '@/components/trips/KontoReiseEintrag'
import type { TripSummary } from '@/types/trips'

const GRUPPEN: { key: keyof ReiseGruppen; titel: string; leer: string }[] = [
  { key: 'aktiv', titel: 'Aktiv', leer: 'Keine aktive Reise.' },
  { key: 'kommend', titel: 'Kommend', leer: 'Keine kommende Reise.' },
  { key: 'vergangen', titel: 'Vergangen', leer: 'Keine vergangene Reise.' },
  { key: 'ohneDatum', titel: 'Ohne Datum', leer: 'Keine Reise ohne Datum.' },
]

export default function KontoReisenGruppen({ reisen }: { reisen: readonly TripSummary[] }) {
  const [heute, setHeute] = useState<string | null>(null)
  const [suche, setSuche] = useState('')

  useEffect(() => {
    setHeute(heutigesDatum())
  }, [])

  const sucheAktiv = suche.trim().length > 0
  const sichtbar = useMemo(
    () => reisen.filter((reise) => reisePasstZurSuche(reise, suche)),
    [reisen, suche],
  )
  const offen = useMemo(() => offeneReisenAus(sichtbar), [sichtbar])
  const archiv = useMemo(() => archivierteReisenAus(sichtbar), [sichtbar])
  const sicht = useMemo(() => (heute ? kontoReisenSichten(reisen, suche, heute) : null), [reisen, suche, heute])
  const keineSuche = sucheAktiv && sichtbar.length === 0

  return (
    <div>
      {reisen.length >= REISEN_LISTE_GRENZE ? (
        <p
          data-testid="reisen-liste-grenze"
          className="mb-5 rounded-2xl border border-line-200 bg-white px-4 py-3 text-sm leading-6 text-ink-700"
        >
          Höchstens die {REISEN_LISTE_GRENZE} zuletzt geänderten Reisen werden geladen und
          angezeigt. Suche, Gruppen und Archiv gelten nur für diese geladene Auswahl.
        </p>
      ) : null}

      <label className="mb-6 block">
        <span className="sr-only">Reise suchen</span>
        <span className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
          <input
            type="search"
            value={suche}
            onChange={(ereignis) => setSuche(ereignis.target.value)}
            placeholder="Reise suchen"
            autoComplete="off"
            className="h-11 w-full rounded-full border border-line-200 bg-white pl-10 pr-4 text-base text-ink-900 outline-none placeholder:text-ink-600 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 pointer-fine:text-sm"
          />
        </span>
      </label>

      {keineSuche ? (
        <p className="rounded-[26px] border border-dashed border-line-400 bg-white/65 px-6 py-10 text-center text-sm leading-6 text-ink-700">
          Keine Reise passt zur Suche.
        </p>
      ) : !sicht ? (
        <div className="space-y-10">
          {offen.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
              {offen.map((reise) => (
                <KontoReiseEintrag key={reise.id} reise={reise} />
              ))}
            </div>
          ) : null}
          <ArchivAbschnitt eintraege={archiv} />
        </div>
      ) : (
        <div className="space-y-10">
          {GRUPPEN.map((gruppe) => {
            const eintraege = sicht.gruppen[gruppe.key]
            if (sucheAktiv && eintraege.length === 0) return null
            return (
              <section key={gruppe.key} aria-labelledby={`reisen-gruppe-${gruppe.key}`}>
                <h2
                  id={`reisen-gruppe-${gruppe.key}`}
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600"
                >
                  {gruppe.titel}
                </h2>
                {eintraege.length === 0 ? (
                  <p className="mt-3 text-sm leading-6 text-ink-700">{gruppe.leer}</p>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {eintraege.map((reise) => (
                      <KontoReiseEintrag key={reise.id} reise={reise} />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
          <ArchivAbschnitt eintraege={sicht.archiv} />
        </div>
      )}
    </div>
  )
}

function ArchivAbschnitt({ eintraege }: { eintraege: readonly TripSummary[] }) {
  if (eintraege.length === 0) return null

  return (
    <section aria-labelledby="reisen-gruppe-archiv">
      <h2
        id="reisen-gruppe-archiv"
        className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600"
      >
        Archiv
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {eintraege.map((reise) => (
          <KontoReiseEintrag key={reise.id} reise={reise} />
        ))}
      </div>
    </section>
  )
}
