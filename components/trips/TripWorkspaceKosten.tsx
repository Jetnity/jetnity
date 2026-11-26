'use client'

import { useEffect, useRef } from 'react'
import { ChevronRight } from 'lucide-react'

import { Abschnitt } from '@/components/ui/abschnitt'
import { Preis } from '@/components/ui/preis'
import { LeistungsStatus, PreisstandHinweis } from '@/components/trips/LeistungsStatus'
import { ART_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import type { Kostenbild, KostenPosten, KostenStand } from '@/lib/trips/kostenbild'
import { cn } from '@/lib/utils'

const STAND: Record<KostenStand, 'vom_nutzer_markiert' | 'unverbindliches_angebot'> = {
  gebucht: 'vom_nutzer_markiert',
  ausgewaehlt: 'unverbindliches_angebot',
}

function anzahlText(anzahl: number, einzahl: string, mehrzahl: string): string {
  return `${anzahl} ${anzahl === 1 ? einzahl : mehrzahl}`
}

function PostenZeile({
  posten,
  onItem,
}: {
  posten: Omit<KostenPosten, 'betrag' | 'waehrung'> & Partial<Pick<KostenPosten, 'betrag' | 'waehrung'>>
  onItem?: (itemId: string) => void
}) {
  const inhalt = (
    <>
      <span className="min-w-0 flex-1 basis-40">
        <strong className="block text-meta font-semibold text-foreground [overflow-wrap:anywhere]">{posten.titel}</strong>
        <span className="mt-0.5 block text-meta text-muted-foreground">{ART_BEZEICHNUNG[posten.art]}</span>
      </span>
      <LeistungsStatus stand={STAND[posten.stand]} />
      <span className="kosten-betrag min-w-[5.5rem] text-right text-meta font-semibold text-foreground">
        {posten.betrag !== undefined && posten.waehrung ? <Preis betrag={posten.betrag} waehrung={posten.waehrung} /> : 'ohne Preis'}
        <PreisstandHinweis />
      </span>
      {onItem ? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
    </>
  )
  const klasse = 'kosten-posten flex min-h-12 w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-1 px-1 py-2.5 text-left'
  return (
    <li className="min-w-0">
      {onItem ? (
        <button
          type="button"
          onClick={() => onItem(posten.id)}
          className={cn(klasse, 'rounded-control hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring/30')}
        >
          {inhalt}
        </button>
      ) : <div className={klasse}>{inhalt}</div>}
    </li>
  )
}

function Budget({ bild }: { bild: Kostenbild }) {
  const budget = bild.budget
  if (!budget) return null
  if (!budget.vergleich) {
    return (
      <p className="text-meta text-muted-foreground">
        Budget <Preis betrag={budget.betrag} waehrung={budget.waehrung} className="font-semibold text-foreground" />.{' '}
        {bild.summen.length === 0
          ? 'Noch kein Preis zum Vergleichen gespeichert.'
          : `Nicht verglichen, weil Preise in einer anderen Währung als ${budget.waehrung} gespeichert sind. Jetnity rechnet nicht um.`}
      </p>
    )
  }

  const { geplant, rest } = budget.vergleich
  const anteil = budget.betrag > 0 ? Math.min(100, Math.round((geplant / budget.betrag) * 100)) : 100
  return (
    <div className="grid gap-2">
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-meta text-muted-foreground">
        <span>Budget <Preis betrag={budget.betrag} waehrung={budget.waehrung} className="font-semibold text-foreground" /></span>
        <span className="font-semibold text-foreground">
          {rest >= 0
            ? <>Noch <Preis betrag={rest} waehrung={budget.waehrung} /> frei</>
            : <><Preis betrag={-rest} waehrung={budget.waehrung} /> über dem Budget</>}
        </span>
      </p>
      <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full', rest >= 0 ? 'bg-primary' : 'bg-destructive')}
          style={{ width: `${anteil}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Kostenbild der Übersicht. Liest nur das Ergebnis von `kostenbild()`; Wahrheitsregeln
 * stehen dort. `ansteuern` scrollt einmal hierher, wenn die Kostenleiste angetippt wurde.
 * Seit dem Premium-Redesign (PR A) setzt kein Aufrufer `ansteuern`, weil die Kostenleiste entfallen ist. Bewusst
 * behalten (kein Löschen im Rahmen von PR A); der Zweig ist durch den Bestand der Kostenansicht gedeckt.
 */
export default function TripWorkspaceKosten({
  bild,
  onItem,
  ansteuern = false,
  onAngesteuert,
}: {
  bild: Kostenbild
  onItem?: (itemId: string) => void
  ansteuern?: boolean
  onAngesteuert?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Passiv statt Layout-Effekt: läuft nach dem Ansichtsfokus des Arbeitsbereichs.
  useEffect(() => {
    if (!ansteuern) return
    const ziel = ref.current
    if (ziel) {
      ziel.scrollIntoView({ block: 'start', behavior: 'instant' })
      ziel.querySelector<HTMLElement>('#reise-kosten-titel')?.focus({ preventScroll: true })
    }
    onAngesteuert?.()
  }, [ansteuern, onAngesteuert])

  const leer = bild.summen.length === 0
  const hinweise = [
    bild.ungueltig > 0 ? `${anzahlText(bild.ungueltig, 'Preis ist', 'Preise sind')} unvollständig gespeichert und ${bild.ungueltig === 1 ? 'zählt' : 'zählen'} nicht mit.` : null,
    bild.mehrdeutig > 0 ? `${anzahlText(bild.mehrdeutig, 'Punkt ist', 'Punkte sind')} widersprüchlich gespeichert und ${bild.mehrdeutig === 1 ? 'zählt' : 'zählen'} nicht mit.` : null,
  ].filter((text): text is string => text !== null)

  return (
    <div ref={ref} className="kosten-behaelter min-w-0">
      <Abschnitt
        id="reise-kosten-titel"
        titel="Kosten"
        beschreibung="Gespeicherte Beträge, keine Live-Preise und kein Zahlungsnachweis. Preisstand unbekannt. Jede Währung für sich."
        data-workspace-kosten={leer ? 'leer' : 'summen'}
        className="kosten-karte h-full"
      >
        {leer ? (
          <p className="text-body text-muted-foreground">
            Noch keine Preise gespeichert. Sobald du einen Flug, eine Unterkunft oder eine Aktivität mit Preis auswählst, steht er hier.
          </p>
        ) : (
          <ul className="kosten-summen grid gap-3 sm:grid-cols-2">
            {bild.summen.map((summe) => (
              <li key={summe.waehrung} className="kosten-summe min-w-0 rounded-control bg-muted px-4 py-3">
                <p className="text-meta text-muted-foreground">Geplant ca.</p>
                <p className="text-title text-foreground"><Preis betrag={summe.gesamt} waehrung={summe.waehrung} /></p>
                <dl className="kosten-summe-liste mt-3 grid gap-2">
                  {(['gebucht', 'ausgewaehlt'] as const).map((stand) => (
                    <div key={stand} className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                      <dt><LeistungsStatus stand={STAND[stand]} /></dt>
                      <dd className="text-meta font-semibold text-foreground">
                        <Preis betrag={stand === 'gebucht' ? summe.gebucht : summe.ausgewaehlt} waehrung={summe.waehrung} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        )}

        {bild.budget ? <div className="mt-4"><Budget bild={bild} /></div> : null}

        {bild.ohnePreis.length > 0 ? (
          <details className="group mt-4 border-t border-border pt-3">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-meta font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              {anzahlText(bild.ohnePreis.length, 'Punkt', 'Punkte')} ohne Preis, nicht mitgerechnet
              <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden="true" />
            </summary>
            <p className="text-meta text-muted-foreground">Jetnity schätzt keine Preise. Sobald du einen Preis speicherst, zählt er mit.</p>
            <ul className="mt-1 divide-y divide-border">
              {bild.ohnePreis.map((posten) => <PostenZeile key={posten.id} posten={posten} onItem={onItem} />)}
            </ul>
          </details>
        ) : null}

        {bild.posten.length > 0 ? (
          <details className="group mt-3 border-t border-border pt-3">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-meta font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              Alle {anzahlText(bild.posten.length, 'Posten', 'Posten')} mit Preis
              <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden="true" />
            </summary>
            <ul className="mt-1 divide-y divide-border">
              {bild.posten.map((posten) => <PostenZeile key={posten.id} posten={posten} onItem={onItem} />)}
            </ul>
          </details>
        ) : null}

        {hinweise.length > 0 ? (
          <ul className="mt-3 grid gap-1 text-meta text-muted-foreground">
            {hinweise.map((text) => <li key={text}>{text}</li>)}
          </ul>
        ) : null}

        <p className="mt-4 text-meta text-muted-foreground">
          «Gebucht» heisst: von dir als gebucht markiert. Jetnity prüft keine Buchung beim Anbieter.
        </p>
      </Abschnitt>
    </div>
  )
}
