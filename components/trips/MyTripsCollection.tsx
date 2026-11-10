'use client'

// components/trips/MyTripsCollection.tsx
//
// Eine montierte Sammlung für /reisen. Suche, Auswahl und Blätterung
// wechseln die Adresse. Sie tauschen diese Instanz nicht aus.

import { useState } from 'react'
import { AlertCircle, MapPin, Plus, RefreshCw, Search, X } from 'lucide-react'

import { useGeraetekalendertag } from '@/components/account/account-home-export-1/useGeraetekalendertag'
import { archivierteReisenAus, kontoReisenSichten, offeneReisenAus } from '@/lib/account/reise-archiv'
import KontoReiseEintrag from '@/components/trips/KontoReiseEintrag'
import { useMyTripsCollectionNavigation } from '@/components/trips/useMyTripsCollectionNavigation'
import { useTripArchiveWorkflow } from '@/components/trips/useTripArchiveWorkflow'
import {
  abschnittTitelKlasse,
  hubDarstellung,
  kartenRasterKlasse,
  MEINE_REISEN_SUCHE,
  zaehlungAus,
  type MeineReisenGruppenKey,
} from '@/lib/trips/my-trips-premium-hub-ux-1'
import {
  ansichtAusAdresse,
  ansichtPhrase,
  sammlungHref,
  type ArchivAuswahl,
  type SammlungErgebnis,
} from '@/lib/trips/reisen-sammlung-abfrage'
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
    <div
      data-archiv-vorgang={vorgang.operationId}
      data-archiv-schreiben={vorgang.write}
      data-archiv-sehen={vorgang.observation}
      data-archiv-liste={vorgang.listenlieferung}
    >
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
  const lesung = angenommen && !angenommen.ungueltig && problem === null ? 'gelesen' : 'nicht-gelesen'
  const archiv = useTripArchiveWorkflow(zeilen, problem, undefined, lesung)
  const [entwurf, setEntwurf] = useState<string | null>(null)
  const [gesuchterText, setGesuchterText] = useState<string | null>(null)
  const heute = useGeraetekalendertag()

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
  if (gesuchterText !== null && gesuchterText === q) {
    setGesuchterText(null)
    if (entwurf?.trim() === q) setEntwurf(null)
  }
  const suchfeld = entwurf ?? q
  const besitz = angenommen
    ? angenommen.ungueltig
      ? 'Die angezeigte Meldung gehört zu einer ungültigen Adresse.'
      : `Diese Ansicht ist ${ansichtPhrase({ q, archiv: auswahl, fortsetzung: cursor !== null })}.`
    : null
  const ziel = ansichtAusAdresse(navigation.live)
  const zielSatz = ziel ? `Geladen wird ${ansichtPhrase(ziel)}.` : 'Die neue Adresse ist keine gültige Ansicht.'
  const sichtbar = new Set(zeilen.map((reise) => reise.id))
  const protokolle = letzteJeReise(archiv.vorgaenge)
  const verborgen = protokolle.filter((vorgang) => !sichtbar.has(vorgang.tripId))
  const sicht = heute && angenommen && !angenommen.ungueltig && !problem ? kontoReisenSichten(zeilen, '', heute) : null
  const darstellung = sicht ? hubDarstellung(zaehlungAus(sicht.gruppen), false) : null
  const offen = offeneReisenAus(zeilen)
  const archiviert = archivierteReisenAus(zeilen)

  function absenden(ereignis: { preventDefault: () => void }) {
    ereignis.preventDefault()
    setGesuchterText(suchfeld.trim())
    navigation.abschicken('commit', sammlungHref({ q: suchfeld.trim(), archiv: auswahl, cursor: null }))
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
      <form onSubmit={absenden} role="search" className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="flex min-w-0 basis-full items-center gap-2 sm:basis-auto sm:flex-1">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Nach Reisetitel, Reiseziel oder Abreiseort suchen</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" aria-hidden="true" />
            <input type="search" value={suchfeld} onChange={(e) => setEntwurf(e.target.value)} placeholder="Reisetitel, Ziel oder Abreiseort" autoComplete="off" data-sammlung-suche className={MEINE_REISEN_SUCHE} />
          </label>
          <button type="submit" aria-label="Suchen" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-800 px-4 text-sm font-semibold text-white">
            <Search className="h-4 w-4 sm:hidden" aria-hidden="true" /><span className="hidden sm:inline">Suchen</span>
          </button>
        </div>
        <div role="group" aria-label="Archivauswahl" className="inline-flex max-w-full flex-wrap gap-1 rounded-2xl border border-line-200 bg-white p-1 sm:rounded-full">
          {AUSWAHL.map((eintrag) => (
            <button key={eintrag.wert} type="button" data-sammlung-archiv={eintrag.wert} aria-pressed={auswahl === eintrag.wert}
              onClick={() => navigation.abschicken('selection', sammlungHref({ q, archiv: eintrag.wert, cursor: null }))}
              className="min-h-11 rounded-full px-3 text-sm font-semibold text-ink-700 aria-pressed:bg-brand-800 aria-pressed:text-white sm:px-4">
              {eintrag.text}
            </button>
          ))}
        </div>
        {(q || suchfeld) ? <button type="button" data-sammlung-leeren onClick={() => {
          setEntwurf('')
          setGesuchterText('')
          navigation.abschicken('clear', sammlungHref({ archiv: auswahl, cursor: null }))
        }} className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-brand-800"><X aria-hidden="true" className="h-4 w-4" />Suche leeren</button> : null}
      </form>

      {navigation.laden ? <p role="status" className="text-sm text-ink-700">Reisen werden geladen …</p> : null}
      {besitz ? <p data-sammlung-besitz className="sr-only">{besitz}</p> : null}
      {!einig ? (
        <p data-sammlung-ziel className="text-sm leading-6 text-ink-700 [overflow-wrap:anywhere]">
          {zielSatz}
          {angenommen && !angenommen.ungueltig ? ' Die bisherigen Reisen bleiben sichtbar.' : null}
          {angenommen?.ungueltig ? ' Die bisherige Meldung bleibt sichtbar.' : null}
        </p>
      ) : null}
      {angenommen?.ungueltig ? (
        <section className="rounded-[26px] border border-line-200 bg-white px-6 py-10 text-center" role="alert">
          <h2 className="text-xl font-semibold text-brand-800">Diese Reiseauswahl ist ungültig.</h2>
          <button type="button" data-sammlung-neu className="mt-3 min-h-11 rounded-full border px-4" onClick={() => { setEntwurf(null); navigation.abschicken('restart', '/reisen') }}>Alle Reisen öffnen</button>
        </section>
      ) : null}

      {problem ? (
        <section role="alert" className="rounded-[26px] border border-red-200 bg-red-50 px-6 py-10 text-center sm:px-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600">
            <AlertCircle className="h-5 w-5" />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-red-800">{fehlerTitel}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-red-700">{fehlerHinweis}</p>
          <button type="button" data-sammlung-erneut disabled={!erneutFrei} onClick={() => navigation.erneut()} className="mt-3 min-h-11 rounded-full border bg-white px-4 text-sm font-semibold text-brand-800">Erneut versuchen</button>
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

      {angenommen?.hatWeiter && angenommen.naechsterCursor ? <button type="button" data-sammlung-weiter disabled={!weiterFrei} onClick={() => {
        navigation.abschicken('continue', sammlungHref({ q, archiv: auswahl, cursor: angenommen.naechsterCursor }))
      }} className="mx-auto block min-h-11 rounded-full border border-line-300 bg-white px-5 text-sm font-semibold text-brand-800">Weitere Reisen</button> : null}
      {!problem && !angenommen?.ungueltig && zeilen.length > 0 ? (
        <div className="flex items-center justify-end gap-2 text-xs text-ink-600">
          <a href="/images/organisieren/Bildnachweise.txt" target="_blank" rel="noopener" className="p-2 underline">Bildnachweise</a>
          <button type="button" data-sammlung-erneut disabled={!erneutFrei} onClick={() => navigation.erneut()} aria-label="Reiseauswahl aktualisieren" title="Reiseauswahl aktualisieren" className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-100 disabled:opacity-50"><RefreshCw aria-hidden="true" className="h-4 w-4" /></button>
        </div>
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
