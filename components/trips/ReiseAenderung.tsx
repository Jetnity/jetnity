'use client'

// components/trips/ReiseAenderung.tsx
//
// Der Einstieg für Phase 2.2 im bestehenden Arbeitsbereich.
//
// Drei Zustände, wie beim Reisevorschlag:
//
//   · `beschreiben` – das Feld
//   · `laeuft` – der Aufruf, das Feld bleibt sichtbar
//   · `vorschlag` – Vorher/Nachher, Speichern erst nach „Änderung übernehmen“
//
// Ein Speicherfehler löscht die Vorschau nicht. Der Aufruf hat Geld gekostet.

import * as React from 'react'
import { useWorkspaceEditSurface } from './TripWorkspaceEditSurface'
import dynamic from 'next/dynamic'
const Manuell = dynamic(() => import('@/components/trips/ReiseAenderungManuell'))
import { Sparkles } from 'lucide-react'

import Aenderungsfortschritt from '@/components/trips/Aenderungsfortschritt'
import AenderungVorschau from '@/components/trips/AenderungVorschau'
import {
  aenderungErzeugen,
  aenderungErzeugenGast,
  aenderungOrteAufloesen,
  aenderungUebernehmen,
} from '@/lib/reiseaenderung/aktionen'
import { mutationskennung, UNGEWISS } from '@/lib/reiseaenderung/direct/bestaetigung'
import { operationenAnwenden } from '@/lib/reiseaenderung/anwenden'
import type { Aenderungsvorschau } from '@/lib/reiseaenderung/erzeugen'
import { AENDERUNG_GRENZEN } from '@/lib/reiseaenderung/schema'
import {
  SpeicherFehler,
  VeralteteFassungFehler,
  gastreiseAendern,
  kennungErzeugen,
} from '@/lib/trips/gastspeicher'
import type { Trip, TripSource } from '@/types/trips'

type ReiseAenderungProps = {
  reise: Trip
  quelle: TripSource
  onGespeichert: (reise?: Trip) => void
}

const BEISPIELE = [
  { kurz: 'Zwei Tage länger', text: 'Mach die Reise zwei Tage länger.' },
  { kurz: 'Ort entfernen', text: 'Entferne Los Angeles.' },
  { kurz: 'Zu dritt', text: 'Wir reisen jetzt zu dritt.' },
  { kurz: 'Entspannter', text: 'Mach die Reise entspannter.' },
  { kurz: 'Tage am Meer', text: 'Füge nach Florenz noch zwei Tage am Meer hinzu.' },
]

function FreitextAenderung({ reise, quelle, onGespeichert, onSperre }: ReiseAenderungProps & { onSperre: (busy: boolean) => void }) {
  const [freitext, setFreitext] = React.useState('')
  const [vorschau, setVorschau] = React.useState<Aenderungsvorschau | null>(null)
  const [meldung, setMeldung] = React.useState('')
  const [laeuft, setLaeuft] = React.useState(false)
  const [warteMs, setWarteMs] = React.useState(0)

  const anlauf = React.useRef(0)
  const alive = React.useRef(true)
  React.useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  React.useLayoutEffect(() => { onSperre(laeuft); return () => onSperre(false) }, [laeuft, onSperre])
  const flight = React.useRef(false)
  const identity = React.useRef({ id: reise.id, revision: reise.revision, quelle })
  React.useEffect(() => { identity.current = { id: reise.id, revision: reise.revision, quelle } }, [reise.id, reise.revision, quelle])
  const current = () => alive.current && identity.current.id === reise.id && identity.current.revision === reise.revision && identity.current.quelle === quelle
  const plant = laeuft && !vorschau
  const gast = quelle === 'guest'

  React.useEffect(() => {
    if (!plant) return
    const beginn = Date.now()
    const uhr = window.setInterval(() => setWarteMs(Date.now() - beginn), 1000)
    return () => window.clearInterval(uhr)
  }, [plant])

  const erzeugen = async (ereignis: React.FormEvent<HTMLFormElement>) => {
    ereignis.preventDefault()
    if (flight.current) return
    flight.current = true
    setMeldung(''); setVorschau(null); setLaeuft(true); setWarteMs(0)
    const eigener = ++anlauf.current
    try {
      const ergebnis = gast
        ? await aenderungErzeugenGast({ reise, text: freitext })
        : await aenderungErzeugen({ tripId: reise.id, text: freitext })
      if (!current() || eigener !== anlauf.current) return
      if (!ergebnis.ok) setMeldung(ergebnis.meldung)
      else setVorschau(ergebnis.vorschau)
    } catch { if (current()) setMeldung('Der Vorschlag ist gerade nicht verfügbar. Dein Text bleibt erhalten.') }
    finally { flight.current = false; if (alive.current) setLaeuft(false) }
  }

  const uebernehmen = async () => {
    if (!vorschau || flight.current) return
    flight.current = true; setMeldung(''); setLaeuft(true)
    try {
      let gespeichert: Trip
      if (gast) {
        const mutationId = await mutationskennung(vorschau.mutationId, reise.id, vorschau.basisRevision, vorschau.aenderung)
        const angewandt = operationenAnwenden(reise, vorschau.aenderung.operationen, kennungErzeugen)
        const orte = angewandt.ok ? await aenderungOrteAufloesen(angewandt.reise) : undefined
        if (!current()) return
        gespeichert = gastreiseAendern({ tripId: reise.id, mutationId, basisRevision: vorschau.basisRevision,
          operationen: vorschau.aenderung.operationen, orte })
      } else {
        const ergebnis = await aenderungUebernehmen({ tripId: reise.id, mutationId: vorschau.mutationId,
          basisRevision: vorschau.basisRevision, aenderung: vorschau.aenderung })
        if (!current()) return
        if (!ergebnis.ok) { setMeldung(ergebnis.meldung); return }
        gespeichert = ergebnis.wert.reise
      }
      if (!current()) return
      setVorschau(null); setFreitext(''); onGespeichert(gespeichert)
    } catch (fehler) {
      if (current()) setMeldung(fehler instanceof VeralteteFassungFehler || fehler instanceof SpeicherFehler ? fehler.message : UNGEWISS)
    } finally { flight.current = false; if (alive.current) setLaeuft(false) }
  }

  return (
    <div data-aenderung-sperre={laeuft ? 'true' : 'false'} className="mt-6 grid gap-6">
      <form
        onSubmit={erzeugen}
        className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_24px_80px_rgba(15,46,42,0.08)] sm:p-7"
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-surface-100 px-3 py-1 text-xs font-semibold text-brand-800">
          <Sparkles className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
          Änderung in eigenen Worten
        </span>

        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-brand-900 sm:text-3xl">
          Was möchtest du an deiner Reise ändern?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-900">
          Beschreibe den Wunsch. Jetnity zeigt dir zuerst, was sich ändern würde – gespeichert wird
          erst, wenn du übernimmst.
        </p>

        <label className="mt-6 grid min-w-0 gap-2 text-sm font-medium text-brand-800">
          Dein Änderungswunsch
          <textarea
            disabled={laeuft}
            value={freitext}
            onChange={(ereignis) => { setFreitext(ereignis.target.value); setVorschau(null) }}
            rows={3}
            maxLength={AENDERUNG_GRENZEN.freitextMaximum}
            placeholder={BEISPIELE[0].text}
            className="w-full min-w-0 resize-y rounded-2xl border border-line-200 bg-surface-0 px-4 py-3 text-base leading-6 outline-none transition placeholder:text-ink-600 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          {BEISPIELE.map((beispiel) => (
            <button
              disabled={laeuft}
              key={beispiel.kurz}
              type="button"
              onClick={() => { setFreitext(beispiel.text); setVorschau(null) }}
              className="inline-flex min-h-11 max-w-full items-center rounded-full border border-line-200 px-4 text-left text-xs font-medium text-ink-900 transition hover:border-line-500"
            >
              <span className="truncate">{beispiel.kurz}</span>
            </button>
          ))}
        </div>

        {plant && (
          <div className="mt-5">
            <Aenderungsfortschritt laufzeitMs={warteMs} />
          </div>
        )}

        {meldung && !vorschau && (
          <div
            role="alert"
            className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
          >
            {meldung}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-line-200 pt-6 sm:flex-row sm:items-center">
          <p className="min-w-0 text-xs leading-5 text-ink-700">
            Preise, Anbieter und Buchungslinks bleiben unangetastet.
          </p>
          <button
            type="submit"
            disabled={laeuft}
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-brand-800 px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(21,58,51,0.18)] transition hover:-translate-y-0.5 hover:bg-brand-900 disabled:pointer-events-none disabled:opacity-60"
          >
            {plant ? 'Änderung entsteht …' : 'Änderung vorschlagen'}
          </button>
        </div>
      </form>

      {vorschau && vorschau.basisRevision !== reise.revision && <p role="alert">Die Reise hat sich inzwischen geändert. Bitte erstelle den Vorschlag am aktuellen Stand erneut.</p>}
      {vorschau && vorschau.basisRevision === reise.revision && (
        <>
          {meldung && (
            <div
              role="alert"
              className="rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {meldung}
            </div>
          )}
          <AenderungVorschau
            vorschau={vorschau}
            laeuft={laeuft}
            onUebernehmen={uebernehmen}
            onVerwerfen={() => {
              setVorschau(null)
              setMeldung('')
            }}
          />
        </>
      )}
    </div>
  )
}

export default function ReiseAenderung(props: ReiseAenderungProps) {
  return <AenderungsSitzung key={`${props.quelle}:${props.reise.id}`} {...props} />
}
function AenderungsSitzung(props: ReiseAenderungProps) {
  const surface = useWorkspaceEditSurface()
  const [modus, setModus] = React.useState<'direkt' | 'text'>('direkt')
  const [generation, setGeneration] = React.useState(0)
  const [sperre, setSperre] = React.useState(false)
  React.useLayoutEffect(() => { surface?.setBusy(sperre); return () => surface?.setBusy(false) }, [sperre, surface])
  return <section aria-label="Reise ändern" data-aenderung-sperre={sperre ? 'true' : 'false'}>
    <div className="mt-5 flex flex-wrap gap-2" aria-label="Bearbeitungsart">
      <button data-aenderung-start type="button" disabled={sperre} aria-pressed={modus === 'direkt'} className="min-h-11 rounded-full border border-line-200 bg-white px-5 py-3 focus-visible:ring-2" onClick={() => setModus('direkt')}>Direkt bearbeiten</button>
      <button type="button" disabled={sperre} aria-pressed={modus === 'text'} className="min-h-11 rounded-full border border-line-200 bg-white px-5 py-3 focus-visible:ring-2" onClick={() => setModus('text')}>In eigenen Worten</button>
    </div>
    {modus === 'direkt' ? <Manuell key={generation} {...props} onSperre={setSperre} onNeu={() => setGeneration(n => n + 1)} /> : <FreitextAenderung {...props} onSperre={setSperre} />}
  </section>
}
