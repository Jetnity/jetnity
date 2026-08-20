'use client'

// components/trips/Reiseidee.tsx
//
// Der Einstieg, den Jetnity V2 eigentlich meint: ein Feld, ein Satz, eine Reise.
//
// ---------------------------------------------------------------------------
// Drei Zustände, nicht mehr
// ---------------------------------------------------------------------------
//
//   · `beschreiben` – das Feld. Hier beginnt es und hierhin führt „Beschreibung
//     ändern“ zurück, mit dem Text von vorher.
//   · `laeuft` – der Aufruf. Das Feld bleibt sichtbar; wer wartet, soll sehen,
//     worauf.
//   · `vorschlag` – die Vorschau. Erst ein Klick auf „Übernehmen“ speichert.
//
// Es gibt keinen Zustand „gespeichert“: Nach dem Übernehmen wechselt die Seite
// in den Arbeitsbereich der Reise. Ein Erfolgshinweis, der stehen bleibt, wäre
// eine zweite Wahrheit über denselben Vorgang.
//
// ---------------------------------------------------------------------------
// Zwei Ausgänge, wie beim Formular
// ---------------------------------------------------------------------------
//
// Ohne Konto legt `gastreiseAblegen()` die Reise im `localStorage` ab, mit Konto
// `vorschlagUebernehmen()` in der Datenbank. Beide Wege sind die bestehenden aus
// Phase 1.5; für Modellreisen entsteht keine zweite Persistenz.
//
// `clientRef` entsteht mit dem Vorschlag und bleibt an ihm hängen. Das ist der
// Grund, warum Doppelklick, Reload und ein erneuter Anlauf nach einem
// Netzwerkabbruch dieselbe Reise ergeben und nicht drei: Im Konto über
// `unique (user_id, client_ref)`, im Browser über die Kennungsprüfung in
// `gastreiseAblegen()`.
//
// ---------------------------------------------------------------------------
// Ein Fehler löscht keinen Vorschlag
// ---------------------------------------------------------------------------
//
// Scheitert das Speichern – voller Browserspeicher, abgebrochene Verbindung,
// bereits bestehender Gastentwurf –, bleibt die Vorschau stehen und die Meldung
// erscheint darüber. Ein Vorschlag, der mit seinem Fehler verschwindet, ist ein
// verlorener Aufruf, und dieser Aufruf hat Geld gekostet.

import * as React from 'react'
import type { Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles } from 'lucide-react'

import Planungsfortschritt from '@/components/trips/Planungsfortschritt'
import VorschlagVorschau from '@/components/trips/VorschlagVorschau'
import { vorschlagErzeugen, vorschlagOrteAufloesen, vorschlagUebernehmen } from '@/lib/reisevorschlag/aktionen'
import { vorschlagAlsReise } from '@/lib/reisevorschlag/abbildung'
import { VORSCHLAG_GRENZEN, type Reisevorschlag } from '@/lib/reisevorschlag/schema'
import {
  GastreiseBestehtFehler,
  SpeicherFehler,
  gastreiseAblegen,
  kennungErzeugen,
} from '@/lib/trips/gastspeicher'

type ReiseideeProps = {
  /** Kommt aus der Server-Komponente: `auth.getUser()` auf dem Server, nicht geraten. */
  angemeldet: boolean
  initialIdee?: string
}

const BEISPIELE = [
  '7 Tage Thailand ab Zürich, zwei Personen, maximal CHF 3’000, Strand, gutes Essen und nicht zu stressig.',
  'Zehn Tage Portugal im Mai, Lissabon und Algarve, Kultur und Küche, entspanntes Tempo.',
  'Familienreise nach Südtirol, zwei Erwachsene und zwei Kinder, eine Woche Natur und Wandern.',
]

export default function Reiseidee({ angemeldet, initialIdee = '' }: ReiseideeProps) {
  const router = useRouter()
  const [freitext, setFreitext] = React.useState(initialIdee)
  const [vorschlag, setVorschlag] = React.useState<Reisevorschlag | null>(null)
  const [warnungen, setWarnungen] = React.useState<string[]>([])
  const [meldung, setMeldung] = React.useState('')
  const [bestehendeReise, setBestehendeReise] = React.useState('')
  const [laeuft, setLaeuft] = React.useState(false)
  const [warteMs, setWarteMs] = React.useState(0)

  // Eine Kennung je Vorschlag. Sie entsteht erst beim Übernehmen und bleibt
  // danach: Ein zweiter Anlauf mit demselben Vorschlag ist derselbe Vorgang.
  const clientRef = React.useRef('')

  // Nur die Antwort auf den letzten Anlauf zählt. Ohne diesen Vergleich könnte
  // eine langsame erste Antwort eine schnellere zweite überschreiben.
  const anlauf = React.useRef(0)

  const plant = laeuft && !vorschlag

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
    setBestehendeReise('')
    setVorschlag(null)
    setWarnungen([])
    setLaeuft(true)

    const eigener = ++anlauf.current
    const ergebnis = await vorschlagErzeugen(freitext)
    if (eigener !== anlauf.current) return

    setLaeuft(false)

    if (!ergebnis.ok) {
      setMeldung(ergebnis.meldung)
      return
    }

    clientRef.current = kennungErzeugen('trip')
    setVorschlag(ergebnis.vorschlag)
    setWarnungen(ergebnis.warnungen)
  }

  const uebernehmen = async () => {
    if (!vorschlag || laeuft) return

    setMeldung('')
    setBestehendeReise('')
    setLaeuft(true)

    if (angemeldet) {
      const ergebnis = await vorschlagUebernehmen({ clientRef: clientRef.current, vorschlag })
      if (!ergebnis.ok) {
        setMeldung(ergebnis.meldung)
        setLaeuft(false)
        return
      }
      router.push(`/reisen/${ergebnis.wert}` as Route)
      return
    }

    try {
      const orte = await vorschlagOrteAufloesen(vorschlag)
      const reise = gastreiseAblegen(
        vorschlagAlsReise(vorschlag, clientRef.current, kennungErzeugen, new Date().toISOString(), orte),
      )
      router.push(`/reisen/${reise.id}` as Route)
    } catch (fehler) {
      setLaeuft(false)

      if (fehler instanceof GastreiseBestehtFehler) {
        setBestehendeReise(fehler.bestehendeId)
        setMeldung(fehler.message)
        return
      }

      setMeldung(
        fehler instanceof SpeicherFehler
          ? fehler.message
          : 'Dieser Vorschlag konnte auf diesem Gerät nicht gespeichert werden. Bitte prüfe den Browserspeicher.',
      )
    }
  }

  return (
    <div className="grid gap-6">
      <form
        onSubmit={erzeugen}
        className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_24px_80px_rgba(15,46,42,0.08)] sm:p-8"
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-surface-100 px-3 py-1 text-xs font-semibold text-brand-800">
          <Sparkles className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
          {angemeldet ? 'Reise in deinem Konto' : 'Privater Reiseentwurf'}
        </span>

        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-brand-900 sm:text-4xl">
          Beginnen wir mit deiner Reise.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-900 sm:text-base">
          Beschreibe sie so, wie du sie einem Freund erzählen würdest. Jetnity macht daraus einen
          Entwurf mit Etappen und Tagesstruktur – und zeigt ihn dir, bevor etwas gespeichert wird.
        </p>

        <label className="mt-7 grid min-w-0 gap-2 text-sm font-medium text-brand-800">
          Deine Reise in eigenen Worten
          <textarea
            value={freitext}
            onChange={(ereignis) => setFreitext(ereignis.target.value)}
            rows={4}
            maxLength={VORSCHLAG_GRENZEN.freitextMaximum}
            placeholder={BEISPIELE[0]}
            className="w-full min-w-0 resize-y rounded-2xl border border-line-200 bg-surface-0 px-4 py-3 text-base leading-6 outline-none transition placeholder:text-ink-600 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          {BEISPIELE.map((beispiel, stelle) => (
            <button
              key={beispiel}
              type="button"
              onClick={() => setFreitext(beispiel)}
              className="inline-flex min-h-11 max-w-full items-center rounded-full border border-line-200 px-4 text-left text-xs font-medium text-ink-900 transition hover:border-line-500"
            >
              <span className="truncate">{['Thailand', 'Portugal', 'Südtirol'][stelle]}</span>
            </button>
          ))}
        </div>

        {plant && (
          <div className="mt-5">
            <Planungsfortschritt laufzeitMs={warteMs} />
          </div>
        )}

        {meldung && !vorschlag && (
          <div
            role="alert"
            className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
          >
            {meldung}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-line-200 pt-6 sm:flex-row sm:items-center">
          <p className="min-w-0 text-xs leading-5 text-ink-700">
            Der Entwurf wird dir zuerst gezeigt. Gespeichert wird nichts ohne deine Freigabe.
          </p>
          <button
            type="submit"
            disabled={laeuft}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-800 px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(21,58,51,0.18)] transition hover:-translate-y-0.5 hover:bg-brand-900 disabled:pointer-events-none disabled:opacity-60"
          >
            {plant ? 'Entwurf entsteht …' : 'Entwurf erstellen'}
            {!plant && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </form>

      {vorschlag && (
        <>
          {meldung && (
            <div
              role="alert"
              className="rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              <p>{meldung}</p>
              {bestehendeReise && (
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <Link
                    href={`/reisen/${bestehendeReise}` as Route}
                    className="font-semibold underline underline-offset-2"
                  >
                    Entwurf öffnen
                  </Link>
                  <Link href="/register" className="font-semibold underline underline-offset-2">
                    Konto erstellen
                  </Link>
                </p>
              )}
            </div>
          )}

          <VorschlagVorschau
            vorschlag={vorschlag}
            warnungen={warnungen}
            laeuft={laeuft}
            angemeldet={angemeldet}
            onUebernehmen={uebernehmen}
            onAendern={() => {
              setVorschlag(null)
              setWarnungen([])
              setMeldung('')
              setBestehendeReise('')
            }}
            onVerwerfen={() => {
              setVorschlag(null)
              setWarnungen([])
              setFreitext('')
              setMeldung('')
              setBestehendeReise('')
            }}
          />
        </>
      )}
    </div>
  )
}
