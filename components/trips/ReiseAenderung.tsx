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
import { Sparkles } from 'lucide-react'

import Aenderungsfortschritt from '@/components/trips/Aenderungsfortschritt'
import AenderungVorschau from '@/components/trips/AenderungVorschau'
import {
  aenderungErzeugen,
  aenderungErzeugenGast,
  aenderungOrteAufloesen,
  aenderungUebernehmen,
} from '@/lib/reiseaenderung/aktionen'
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

export default function ReiseAenderung({ reise, quelle, onGespeichert }: ReiseAenderungProps) {
  const [freitext, setFreitext] = React.useState('')
  const [vorschau, setVorschau] = React.useState<Aenderungsvorschau | null>(null)
  const [meldung, setMeldung] = React.useState('')
  const [laeuft, setLaeuft] = React.useState(false)
  const [warteMs, setWarteMs] = React.useState(0)

  const anlauf = React.useRef(0)
  const plant = laeuft && !vorschau
  const gast = quelle === 'guest'

  React.useEffect(() => {
    if (!plant) {
      setWarteMs(0)
      return
    }
    const beginn = Date.now()
    const uhr = window.setInterval(() => setWarteMs(Date.now() - beginn), 1000)
    return () => window.clearInterval(uhr)
  }, [plant])

  const erzeugen = async (ereignis: React.FormEvent<HTMLFormElement>) => {
    ereignis.preventDefault()
    if (laeuft) return

    setMeldung('')
    setVorschau(null)
    setLaeuft(true)

    const eigener = ++anlauf.current
    const ergebnis = gast
      ? await aenderungErzeugenGast({ reise, text: freitext })
      : await aenderungErzeugen({ tripId: reise.id, text: freitext })

    if (eigener !== anlauf.current) return

    setLaeuft(false)

    if (!ergebnis.ok) {
      setMeldung(ergebnis.meldung)
      return
    }

    setVorschau(ergebnis.vorschau)
  }

  const uebernehmen = async () => {
    if (!vorschau || laeuft) return

    setMeldung('')
    setLaeuft(true)

    if (gast) {
      try {
        const angewandt = operationenAnwenden(reise, vorschau.aenderung.operationen, kennungErzeugen)
        const orte = angewandt.ok ? await aenderungOrteAufloesen(angewandt.reise) : undefined
        const gespeichert = gastreiseAendern({
          mutationId: vorschau.mutationId,
          basisRevision: vorschau.basisRevision,
          operationen: vorschau.aenderung.operationen,
          orte,
        })
        setVorschau(null)
        setFreitext('')
        setLaeuft(false)
        onGespeichert(gespeichert)
      } catch (fehler) {
        setLaeuft(false)
        setMeldung(
          fehler instanceof VeralteteFassungFehler || fehler instanceof SpeicherFehler
            ? fehler.message
            : fehler instanceof Error
              ? fehler.message
              : 'Die Änderung konnte auf diesem Gerät nicht gespeichert werden. Die Vorschau bleibt stehen.',
        )
      }
      return
    }

    const ergebnis = await aenderungUebernehmen({
      tripId: reise.id,
      mutationId: vorschau.mutationId,
      basisRevision: vorschau.basisRevision,
      aenderung: vorschau.aenderung,
    })

    if (!ergebnis.ok) {
      setLaeuft(false)
      setMeldung(ergebnis.meldung)
      return
    }

    setVorschau(null)
    setFreitext('')
    setLaeuft(false)
    onGespeichert()
  }

  return (
    <div className="mt-6 grid gap-6">
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
            value={freitext}
            onChange={(ereignis) => setFreitext(ereignis.target.value)}
            rows={3}
            maxLength={AENDERUNG_GRENZEN.freitextMaximum}
            placeholder={BEISPIELE[0].text}
            className="w-full min-w-0 resize-y rounded-2xl border border-line-200 bg-surface-0 px-4 py-3 text-base leading-6 outline-none transition placeholder:text-ink-600 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          {BEISPIELE.map((beispiel) => (
            <button
              key={beispiel.kurz}
              type="button"
              onClick={() => setFreitext(beispiel.text)}
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

      {vorschau && (
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
