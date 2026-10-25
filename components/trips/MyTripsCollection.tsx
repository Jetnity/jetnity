'use client'

// components/trips/MyTripsCollection.tsx
//
// Eine montierte Sammlung für /reisen. Suche, Auswahl und Blätterung
// wechseln die Adresse. Sie tauschen diese Instanz nicht aus.

import { useEffect, useState } from 'react'
import { AlertCircle, MapPin, Plus, Search } from 'lucide-react'

import { heutigesDatum } from '@/lib/account/naechste-reise'
import { archivierteReisenAus, kontoReisenSichten, offeneReisenAus } from '@/lib/account/reise-archiv'
import KontoReiseEintrag from '@/components/trips/KontoReiseEintrag'
import { useMyTripsCollectionNavigation } from '@/components/trips/useMyTripsCollectionNavigation'
import { useTripArchiveWorkflow } from '@/components/trips/useTripArchiveWorkflow'
import {
  abschnittTitelKlasse,
  hubDarstellung,
  kartenRasterKlasse,
  leistenKlasse,
  MEINE_REISEN_SUCHE,
  zaehlungAus,
  type MeineReisenGruppenKey,
} from '@/lib/trips/my-trips-premium-hub-ux-1'
import { sammlungHref, type ArchivAuswahl, type SammlungErgebnis } from '@/lib/trips/reisen-sammlung-abfrage'
import { archivHinweis, type ArchivVorgang } from '@/lib/trips/trip-archive-workflow'
import type { TripSummary } from '@/types/trips'

const LEERE_ZEILEN: TripSummary[] = []

const AUSWAHL: { wert: ArchivAuswahl; text: string }[] = [
  { wert: 'alle', text: 'Alle' },
  { wert: 'offen', text: 'Offen' },
  { wert: 'archiv', text: 'Archiv' },
]

function letzteJeReise(vorgaenge: readonly ArchivVorgang[]): ArchivVorgang[] {
  const karte = new Map<string, ArchivVorgang>()
  for (const vorgang of vorgaenge) karte.set(vorgang.tripId, vorgang)
  return [...karte.values()]
}

function VorgangHinweis({ vorgang }: { vorgang: ArchivVorgang }) {
  const text = archivHinweis(vorgang)
  return (
    <div data-archiv-vorgang={vorgang.operationId} data-archiv-schreiben={vorgang.write} data-archiv-sehen={vorgang.observation}>
      <p className="text-sm leading-6 text-ink-700">{text.schreiben}</p>
      <p className="text-sm leading-6 text-ink-700">{text.sehen}</p>
    </div>
  )
}

export default function MyTripsCollection({
  ergebnis,
  fehlerTitel,
  leerTitel,
  fehlerHinweis,
}: {
  ergebnis: SammlungErgebnis
  fehlerTitel: string
  leerTitel: string
  fehlerHinweis: string
}) {
  const navigation = useMyTripsCollectionNavigation(ergebnis)
  const angenommen = navigation.angenommen
  const zeilen = angenommen?.zeilen ?? LEERE_ZEILEN
  const problem = angenommen?.problem ?? null
  const archiv = useTripArchiveWorkflow(zeilen, problem)
  const [entwurf, setEntwurf] = useState('')
  const [heute, setHeute] = useState<string | null>(null)

  useEffect(() => {
    setHeute(heutigesDatum())
  }, [])

  const q = angenommen?.q ?? ''
  const auswahl = angenommen?.archiv ?? 'alle'
  const cursor = angenommen?.cursor ?? null
  const einig = navigation.einig
  const weiterFrei = einig && Boolean(angenommen?.hatWeiter && angenommen.naechsterCursor)
  const erneutFrei = einig
  const leerKonto = Boolean(angenommen && !angenommen.ungueltig && !problem && zeilen.length === 0 && q === '' && auswahl === 'alle' && cursor === null)
  const fortsetzungLeer = Boolean(angenommen && !angenommen.ungueltig && !problem && zeilen.length === 0 && cursor)
  const keineSuche = Boolean(angenommen && !angenommen.ungueltig && !problem && zeilen.length === 0 && q !== '' && cursor === null)
  const keineAuswahl = Boolean(
    angenommen && !angenommen.ungueltig && !problem && zeilen.length === 0 && q === '' && auswahl !== 'alle' && cursor === null,
  )
  const entwurfOffen = entwurf.trim() !== q
  const sichtbar = new Set(zeilen.map((reise) => reise.id))
  const protokolle = letzteJeReise(archiv.vorgaenge)
  const verborgen = protokolle.filter((vorgang) => !sichtbar.has(vorgang.tripId))
  const sicht = heute && angenommen && !angenommen.ungueltig && !problem ? kontoReisenSichten(zeilen, '', heute) : null
  const darstellung = sicht ? hubDarstellung(zaehlungAus(sicht.gruppen), false) : null
  const offen = offeneReisenAus(zeilen)
  const archiviert = archivierteReisenAus(zeilen)

  function absenden(ereignis: { preventDefault: () => void }) {
    ereignis.preventDefault()
    navigation.abschicken('commit', sammlungHref({ q: entwurf.trim(), archiv: auswahl, cursor: null }))
  }

  return (
    <div
      data-sammlung-wurzel
      data-sammlung-id={archiv.collectionId}
      data-sammlung-laden={navigation.laden ? '1' : '0'}
      data-sammlung-art={navigation.art ?? ''}
      data-sammlung-live={navigation.live}
      data-sammlung-uebernommen={angenommen?.adresse ?? ''}
      data-sammlung-einig={einig ? '1' : '0'}
      className="min-w-0 space-y-6 overflow-x-hidden"
    >
      <form onSubmit={absenden} className="rounded-[28px] border border-line-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,46,42,0.04)] sm:p-4">
        <label className="block">
          <span className="sr-only">Reise suchen</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
            <input
              type="search"
              value={entwurf}
              onChange={(ereignis) => setEntwurf(ereignis.target.value)}
              placeholder="Reise suchen"
              autoComplete="off"
              data-sammlung-suche
              className={MEINE_REISEN_SUCHE}
            />
          </span>
        </label>
        <p className="mt-3 text-sm leading-6 text-ink-700">Suche in Titel und Herkunft.</p>
        {entwurfOffen ? <p className="mt-1 text-sm leading-6 text-ink-700">Der Entwurf ist noch nicht die Suche.</p> : null}
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Archivauswahl">
          {AUSWAHL.map((eintrag) => (
            <button
              key={eintrag.wert}
              type="button"
              data-sammlung-archiv={eintrag.wert}
              aria-pressed={auswahl === eintrag.wert}
              onClick={() => navigation.abschicken('selection', sammlungHref({ q, archiv: eintrag.wert, cursor: null }))}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-line-300 bg-white px-4 text-sm font-semibold text-brand-800"
            >
              {eintrag.text}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white"
          >
            Suchen
          </button>
          <button
            type="button"
            data-sammlung-leeren
            onClick={() => navigation.abschicken('clear', sammlungHref({ archiv: auswahl, cursor: null }))}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-line-300 bg-white px-4 text-sm font-semibold text-brand-800"
          >
            Suche leeren
          </button>
          <button
            type="button"
            data-sammlung-neu
            onClick={() => navigation.abschicken('restart', '/reisen')}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-line-300 bg-white px-4 text-sm font-semibold text-brand-800"
          >
            Ansicht zurücksetzen
          </button>
          <button
            type="button"
            data-sammlung-erneut
            disabled={!erneutFrei}
            onClick={() => navigation.erneut()}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-line-300 bg-white px-4 text-sm font-semibold text-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Ansicht erneut laden
          </button>
          <button
            type="button"
            data-sammlung-weiter
            disabled={!weiterFrei}
            onClick={() => {
              if (!angenommen?.naechsterCursor) return
              navigation.abschicken(
                'continue',
                sammlungHref({ q, archiv: auswahl, cursor: angenommen.naechsterCursor }),
              )
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-line-300 bg-white px-4 text-sm font-semibold text-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Weitere Reisen
          </button>
        </div>
      </form>

      {navigation.laden ? <p className="text-sm leading-6 text-ink-700">Diese Ansicht wird geladen.</p> : null}
      {navigation.laden || !einig ? (
        <p className="text-sm leading-6 text-ink-700">Die angezeigten Reisen sind das zuletzt geladene Ergebnis.</p>
      ) : null}
      {angenommen && !angenommen.ungueltig && !problem && zeilen.length > 0 ? (
        <p className="text-sm leading-6 text-ink-700">
          {zeilen.length === 1 ? '1 Reise auf dieser Seite.' : `${zeilen.length} Reisen auf dieser Seite.`} Das ist nicht
          die Zahl aller Reisen im Konto.
        </p>
      ) : null}

      {angenommen?.ungueltig ? (
        <section className="rounded-[26px] border border-line-200 bg-white px-6 py-10 text-center" role="alert">
          <h2 className="text-xl font-semibold text-brand-800">Diese Adresse ist keine gültige Ansicht.</h2>
        </section>
      ) : null}

      {problem ? (
        <section role="alert" className="rounded-[26px] border border-red-200 bg-red-50 px-6 py-10 text-center sm:px-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600">
            <AlertCircle className="h-5 w-5" />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-red-800">{fehlerTitel}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-red-700">{fehlerHinweis}</p>
        </section>
      ) : null}

      {leerKonto ? (
        <section className="rounded-[30px] border border-dashed border-line-400 bg-white/65 px-6 py-14 text-center sm:px-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
            <MapPin className="h-5 w-5" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-brand-800">{leerTitel}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-700">
            Erstelle deine erste Reise. Sie wird dauerhaft gespeichert und lässt sich von jedem Gerät aus weiterplanen.
          </p>
          <a
            href="/planen"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Reise erstellen
          </a>
        </section>
      ) : null}

      {keineSuche ? <p className="text-sm leading-6 text-ink-700">Keine Reise passt zur Suche.</p> : null}
      {keineAuswahl ? <p className="text-sm leading-6 text-ink-700">Keine Reise in dieser Auswahl.</p> : null}
      {fortsetzungLeer ? <p className="text-sm leading-6 text-ink-700">Keine weitere Reise in dieser Auswahl.</p> : null}

      {!angenommen?.ungueltig && !problem && zeilen.length > 0 ? (
        sicht && darstellung ? (
          <div className="space-y-6">
            <ul className="flex flex-wrap gap-2" aria-label="Reisegruppen">
              {darstellung.leiste
                .filter((eintrag) => eintrag.sichtbar)
                .map((eintrag) => (
                  <li key={eintrag.key}>
                    <span className={leistenKlasse(eintrag)}>
                      {eintrag.titel} {eintrag.anzahl}
                    </span>
                  </li>
                ))}
            </ul>
            {darstellung.leiste
              .filter((eintrag) => eintrag.karten)
              .map((eintrag) => (
                <Abschnitt
                  key={eintrag.key}
                  schluessel={eintrag.key}
                  titel={eintrag.titel}
                  schwerpunkt={eintrag.schwerpunkt}
                  eintraege={sicht.gruppen[eintrag.key]}
                  workflow={archiv}
                />
              ))}
            <ArchivBlock eintraege={sicht.archiv} workflow={archiv} />
          </div>
        ) : (
          <div className="space-y-6" data-reisen-kalender="wartet">
            {offen.length > 0 ? (
              <div className={kartenRasterKlasse(offen.length)}>
                {offen.map((reise) => (
                  <Karte key={reise.id} reise={reise} workflow={archiv} />
                ))}
              </div>
            ) : null}
            <ArchivBlock eintraege={archiviert} workflow={archiv} />
          </div>
        )
      ) : null}

      {verborgen.length > 0 ? (
        <div data-archiv-protokoll className="space-y-2 rounded-2xl border border-line-200 bg-white px-4 py-3">
          {verborgen.map((vorgang) => (
            <VorgangHinweis key={vorgang.operationId} vorgang={vorgang} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Karte({
  reise,
  lage,
  workflow,
}: {
  reise: TripSummary
  lage?: 'aktiv' | 'kommend' | 'vergangen' | 'ohneDatum' | 'archiv'
  workflow: ReturnType<typeof useTripArchiveWorkflow>
}) {
  return (
    <div className="min-w-0" data-reise-id={reise.id}>
      <KontoReiseEintrag reise={reise} lage={lage} workflow={workflow} />
    </div>
  )
}

function Abschnitt({
  schluessel,
  titel,
  schwerpunkt,
  eintraege,
  workflow,
}: {
  schluessel: MeineReisenGruppenKey
  titel: string
  schwerpunkt: boolean
  eintraege: readonly TripSummary[]
  workflow: ReturnType<typeof useTripArchiveWorkflow>
}) {
  return (
    <section aria-labelledby={`sammlung-gruppe-${schluessel}`} className="min-w-0">
      <h2 id={`sammlung-gruppe-${schluessel}`} className={abschnittTitelKlasse(schwerpunkt)}>
        {titel}
      </h2>
      <div className={kartenRasterKlasse(eintraege.length)}>
        {eintraege.map((reise) => (
          <Karte key={reise.id} reise={reise} lage={schluessel} workflow={workflow} />
        ))}
      </div>
    </section>
  )
}

function ArchivBlock({
  eintraege,
  workflow,
}: {
  eintraege: readonly TripSummary[]
  workflow: ReturnType<typeof useTripArchiveWorkflow>
}) {
  if (eintraege.length === 0) return null
  return (
    <section aria-labelledby="sammlung-gruppe-archiv" className="min-w-0">
      <h2 id="sammlung-gruppe-archiv" className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
        Archiv
      </h2>
      <div className={kartenRasterKlasse(eintraege.length)}>
        {eintraege.map((reise) => (
          <Karte key={reise.id} reise={reise} lage="archiv" workflow={workflow} />
        ))}
      </div>
    </section>
  )
}
