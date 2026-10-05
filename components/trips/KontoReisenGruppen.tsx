'use client'

// components/trips/KontoReisenGruppen.tsx
//
// Ableitende Gruppen für Kontoreisen. Klassifikation erst am Geräte-Kalendertag.
// Leere Gruppen bleiben als Zähler und Satz sichtbar, ohne eigene hohe Sektion.
// Archivfilter ist von der date-only-Lage getrennt.

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { heutigesDatum } from '@/lib/account/naechste-reise'
import { archivierteReisenAus, kontoReisenSichten, offeneReisenAus } from '@/lib/account/reise-archiv'
import { reisePasstZurSuche } from '@/lib/account/reise-lage'
import { REISEN_LISTE_GRENZE } from '@/lib/trips/liste-grenze'
import {
  abschnittTitelKlasse,
  hubDarstellung,
  kartenRasterKlasse,
  leistenKlasse,
  MEINE_REISEN_SUCHE,
  trefferText,
  zaehlungAus,
  type MeineReisenGruppenKey,
} from '@/lib/trips/my-trips-premium-hub-ux-1'
import KontoReiseEintrag from '@/components/trips/KontoReiseEintrag'
import type { TripSummary } from '@/types/trips'

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
  const darstellung = sicht ? hubDarstellung(zaehlungAus(sicht.gruppen), sucheAktiv) : null
  const leiste = darstellung?.leiste.filter((eintrag) => eintrag.sichtbar) ?? []

  return (
    <div data-reisen-hub={sicht ? 'bereit' : 'kalender'} className="min-w-0 space-y-6">
      {reisen.length >= REISEN_LISTE_GRENZE ? (
        <p
          data-testid="reisen-liste-grenze"
          className="rounded-2xl border border-line-200 bg-white px-4 py-3 text-sm leading-6 text-ink-700"
        >
          Höchstens die {REISEN_LISTE_GRENZE} zuletzt geänderten Reisen werden geladen und
          angezeigt. Suche, Gruppen und Archiv gelten nur für diese geladene Auswahl.
        </p>
      ) : null}

      <div className="rounded-[28px] border border-line-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,46,42,0.04)] sm:p-4">
        <label className="block">
          <span className="sr-only">Reise suchen</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
            <input
              type="search"
              value={suche}
              onChange={(ereignis) => setSuche(ereignis.target.value)}
              placeholder="Reise suchen"
              autoComplete="off"
              className={MEINE_REISEN_SUCHE}
            />
          </span>
        </label>

        {sucheAktiv && sichtbar.length > 0 ? (
          <p data-reisen-treffer={sichtbar.length} className="mt-3 text-sm leading-6 text-ink-700">
            {trefferText(sichtbar.length)}
          </p>
        ) : null}

        {leiste.length > 0 ? (
          <ul data-reisen-leiste className="mt-3 flex flex-wrap gap-2" aria-label="Reisegruppen">
            {leiste.map((eintrag) => (
              <li
                key={eintrag.key}
                data-reisen-gruppe={eintrag.key}
                data-reisen-anzahl={eintrag.anzahl}
              >
                <span className={leistenKlasse(eintrag)} aria-label={`${eintrag.titel}, ${eintrag.anzahl}`}>
                  <span aria-hidden="true">{eintrag.titel}</span>
                  <span aria-hidden="true" className="tabular-nums">
                    {eintrag.anzahl}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {darstellung?.leertext ? (
          <p data-reisen-leertext className="mt-3 text-sm leading-6 text-ink-700">
            {darstellung.leertext}
          </p>
        ) : null}
      </div>

      {keineSuche ? (
        <p className="rounded-[26px] border border-dashed border-line-400 bg-white/65 px-4 py-6 text-center text-sm leading-6 text-ink-700">
          Keine Reise passt zur Suche.
        </p>
      ) : !sicht || !darstellung ? (
        <div className="space-y-6">
          {offen.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
              {offen.map((reise) => (
                <KontoReiseEintrag key={reise.id} reise={reise} />
              ))}
            </div>
          ) : null}
          <ArchivAbschnitt eintraege={archiv} />
        </div>
      ) : (
        <div className="space-y-6">
          {darstellung.leiste
            .filter((eintrag) => eintrag.karten)
            .map((eintrag) => (
              <GruppenAbschnitt
                key={eintrag.key}
                schluessel={eintrag.key}
                titel={eintrag.titel}
                schwerpunkt={eintrag.schwerpunkt}
                eintraege={sicht.gruppen[eintrag.key]}
              />
            ))}
          <ArchivAbschnitt eintraege={sicht.archiv} />
        </div>
      )}
    </div>
  )
}

function GruppenAbschnitt({
  schluessel,
  titel,
  schwerpunkt,
  eintraege,
}: {
  schluessel: MeineReisenGruppenKey
  titel: string
  schwerpunkt: boolean
  eintraege: readonly TripSummary[]
}) {
  return (
    <section
      aria-labelledby={`reisen-gruppe-${schluessel}`}
      data-reisen-abschnitt={schluessel}
      className="min-w-0"
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id={`reisen-gruppe-${schluessel}`} className={abschnittTitelKlasse(schwerpunkt)}>
          {titel}
        </h2>
        <p className="text-sm tabular-nums text-ink-700">{eintraege.length}</p>
      </div>
      <div className={kartenRasterKlasse(eintraege.length)}>
        {eintraege.map((reise) => (
          <KontoReiseEintrag key={reise.id} reise={reise} lage={schluessel} />
        ))}
      </div>
    </section>
  )
}

function ArchivAbschnitt({ eintraege }: { eintraege: readonly TripSummary[] }) {
  if (eintraege.length === 0) return null

  return (
    <section aria-labelledby="reisen-gruppe-archiv" data-reisen-abschnitt="archiv" className="min-w-0">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2
          id="reisen-gruppe-archiv"
          className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700"
        >
          Archiv
        </h2>
        <p className="text-sm tabular-nums text-ink-700">{eintraege.length}</p>
      </div>
      <div className={kartenRasterKlasse(eintraege.length)}>
        {eintraege.map((reise) => (
          <KontoReiseEintrag key={reise.id} reise={reise} lage="archiv" />
        ))}
      </div>
    </section>
  )
}
