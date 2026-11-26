'use client'

import { useState, type ReactNode } from 'react'
import { CalendarDays, ShieldCheck, Users } from 'lucide-react'

import { useGeraetekalendertag } from '@/components/account/account-home-export-1/useGeraetekalendertag'
import { useStadtbild } from '@/components/trips/organisieren/Stadtbild'
import { BildnachweisKnopf } from '@/components/ui/bildnachweis'
import { bildMitNachweis } from '@/lib/trips/organisieren/bildnachweise'
import { kopfbildEtappe, reisephaseAbleiten } from '@/lib/trips/reisephase'
import type { UebersichtAbleitung } from '@/lib/trips/uebersicht'
import type { WorkspaceAnsicht } from '@/lib/trips/workspace-mode'
import type { Trip, TripSource } from '@/types/trips'

/**
 * Gemeinsamer Reisekopf für Übersicht, Reiseplan, Organisieren, Vorbereitung und Einreise.
 * Alles hier ist aus echten Reisedaten abgeleitet; es gibt keine gespeicherte Phase,
 * kein erfundenes Wetter und kein Budget. Ein Bild wird nur mit seinem Nachweis gezeigt
 * und gehört zur belegten Etappe von «Heute laut Plan»; bei unklarer Zuordnung bleibt das
 * Motiv neutral.
 */
export default function Reisekopf({
  reise,
  quelle,
  uebersicht,
  ansicht,
  uebersichtAktiv,
  aktion,
  kopfzeile,
  reiseoptionen,
}: {
  reise: Trip
  quelle: TripSource
  uebersicht: UebersichtAbleitung
  ansicht: WorkspaceAnsicht
  uebersichtAktiv: boolean
  /** «Reise ändern»: öffnet und schliesst den bestehenden Änderungsweg. */
  aktion?: ReactNode
  /** Speicherfehler. Solange einer ansteht, steht er anstelle der Speichernotiz. */
  kopfzeile?: ReactNode
  reiseoptionen?: ReactNode
}) {
  const gast = quelle === 'guest'
  const heute = useGeraetekalendertag()
  const phase = reisephaseAbleiten(reise, heute)
  const stadtbild = useStadtbild(kopfbildEtappe(reise, phase))
  const bild = bildMitNachweis(stadtbild.src, stadtbild.photo)
  const [fehlgeschlagen, setFehlgeschlagen] = useState<string | null>(null)
  const bildSichtbar = fehlgeschlagen !== bild.src

  const uebersichtKopf = ansicht === 'uebersicht'
  const anzahl = uebersicht.personen.anzahl

  return (
    <section
      data-workspace-identity
      data-workspace-kopf={ansicht}
      data-kopf-dichte={uebersichtKopf ? 'voll' : 'kompakt'}
      data-reisephase={phase.art}
      data-save-truth={gast ? 'device' : 'account'}
      className="reisekopf"
    >
      {bildSichtbar ? (
        <span className="reisekopf-grund" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bild.src}
            alt=""
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFehlgeschlagen(bild.src)}
          />
        </span>
      ) : null}
      <div className="reisekopf-inhalt">
        <p className="reisekopf-phase" data-reisephase-text={phase.art}>{phase.kopfzeile}</p>
        <div className="reisekopf-titelzeile">
          <h1
            tabIndex={-1}
            data-workspace-modus-heading={uebersichtAktiv ? '' : undefined}
            className="text-display outline-none"
          >
            {uebersicht.titel}
          </h1>
          {aktion}
        </div>
        {phase.heute ? <p className="reisekopf-heute">{phase.heute}</p> : null}
        <dl className="reisekopf-meta text-meta">
          <div><CalendarDays aria-hidden="true" /><dt className="sr-only">Zeitraum</dt><dd>{uebersicht.zeitraum}</dd></div>
          <div title={uebersicht.personen.text}>
            <Users aria-hidden="true" />
            <dt className="sr-only">Reisende</dt>
            <dd><span aria-hidden="true">{anzahl ?? '–'}</span><span className="sr-only">{uebersicht.personen.text}</span></dd>
          </div>
        </dl>
        {kopfzeile ? (
          <div className="reisekopf-meldung">{kopfzeile}</div>
        ) : (
          <p className={gast ? 'sr-only' : 'reisekopf-speicher text-meta'} data-reisekopf-speicher>
            <ShieldCheck aria-hidden="true" />
            {gast ? 'Nur auf diesem Gerät gespeichert' : 'Im Konto gespeichert'}
          </p>
        )}
        {uebersichtKopf && reiseoptionen ? (
          <details data-reiseoptionen className="workspace-reiseoptionen reisekopf-optionen">
            <summary>Reiseoptionen</summary>
            <div className="reisekopf-optionen-inhalt">{reiseoptionen}</div>
          </details>
        ) : null}
      </div>
      {bildSichtbar ? <BildnachweisKnopf key={bild.src} nachweis={bild.nachweis} /> : null}
    </section>
  )
}
