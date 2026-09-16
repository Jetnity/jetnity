'use client'

// components/trips/Reisebegleiter.tsx
//
// Die eine Assistant-Fläche im Reise-Arbeitsbereich.
//
// Kein schwebender Chat auf der ganzen Seite, kein neuer Hauptbereich, kein
// Verlauf: ein Feld, eine Frage, eine Auskunft. Der Reisebegleiter ist ein
// Werkzeug in der Reise und keine zweite Oberfläche daneben.
//
// Drei Zustände:
//
//   · `fragen` – das Feld
//   · `laeuft` – der Aufruf, das Feld bleibt sichtbar
//   · `auskunft` – Antwort, offene Punkte, Vorschläge, Jetnity-Stand
//
// Nichts läuft beim Mounten. Ein bezahlter Aufruf entsteht nur durch Absenden;
// die Fläche selbst kostet nichts. Sie löst auch keine Provider- oder
// Preisanfrage aus – es gibt hier keine.
//
// Der Zustand eines Bezugs kommt aus `lib/reisebegleiter/nutzlast.ts` und nicht
// aus dem Modell. Was unter „Jetnity-Stand" steht, hat das Modell nicht
// geschrieben und kann es nicht verfälschen.

import * as React from 'react'
import { AlertTriangle, CircleHelp, Compass } from 'lucide-react'

import { begleiterFragen } from '@/lib/reisebegleiter/aktionen'
import type { Begleiterauskunft } from '@/lib/reisebegleiter/erzeugen'
import { BEGLEITER_GRENZEN } from '@/lib/reisebegleiter/schema'
import { cn } from '@/lib/utils'
import type { Trip } from '@/types/trips'

type ReisebegleiterProps = {
  reise: Trip
}

const BEISPIELE = [
  { kurz: 'Was ist noch offen?', text: 'Was ist bei dieser Reise noch offen?' },
  { kurz: 'Reisedokumente', text: 'Was sollte ich bei den Reisedokumenten für diese Reise prüfen?' },
  { kurz: 'Reisezeit', text: 'Passt der Zeitraum zu den Etappen dieser Reise?' },
  { kurz: 'Etappen', text: 'Ist die Aufteilung der Etappen sinnvoll?' },
]

const ART_TITEL: Record<Begleiterauskunft['bezuege'][number]['art'], string> = {
  etappe: 'Etappe',
  reisende: 'Reisende',
  official: 'Offizielle Anforderung',
  safety: 'Sicherheitslage',
  seasonal: 'Reisezeit',
}

export default function Reisebegleiter({ reise }: ReisebegleiterProps) {
  const [frage, setFrage] = React.useState('')
  const [auskunft, setAuskunft] = React.useState<Begleiterauskunft | null>(null)
  const [meldung, setMeldung] = React.useState('')
  const [laeuft, setLaeuft] = React.useState(false)

  const anlauf = React.useRef(0)

  const fragen = async (ereignis: React.FormEvent<HTMLFormElement>) => {
    ereignis.preventDefault()
    if (laeuft) return

    setMeldung('')
    setAuskunft(null)
    setLaeuft(true)

    const eigener = ++anlauf.current
    const ergebnis = await begleiterFragen({ tripId: reise.id, frage })

    // Eine ältere Antwort darf eine neuere nicht überschreiben. Ohne diese
    // Prüfung entscheidet die Reihenfolge der Netzantworten, was am Ende steht.
    if (eigener !== anlauf.current) return

    setLaeuft(false)

    if (!ergebnis.ok) {
      setMeldung(ergebnis.meldung)
      return
    }

    setAuskunft(ergebnis.auskunft)
  }

  return (
    <div className="mt-6 grid gap-6">
      <form
        onSubmit={fragen}
        className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_24px_80px_rgba(15,46,42,0.08)] sm:p-7"
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-surface-100 px-3 py-1 text-xs font-semibold text-brand-800">
          <Compass className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
          Generierter Vorschlag
        </span>

        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-brand-900 sm:text-3xl">
          Frag den Reisebegleiter
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-900">
          Er kennt genau diese Reise und antwortet als Vorschlag – keine amtliche Auskunft, keine
          Anbieterauskunft, keine Preise. Deine Reise wird dadurch nicht geändert.
        </p>

        <label htmlFor="reisebegleiter-frage" className="mt-6 block text-sm font-medium text-brand-800">
          Deine Frage zu dieser Reise
        </label>
        <textarea
          id="reisebegleiter-frage"
          value={frage}
          onChange={(ereignis) => setFrage(ereignis.target.value)}
          rows={3}
          maxLength={BEGLEITER_GRENZEN.frageMaximum}
          placeholder={BEISPIELE[0].text}
          className="mt-2 w-full min-w-0 resize-y rounded-2xl border border-line-200 bg-surface-0 px-4 py-3 text-base leading-6 outline-none transition placeholder:text-ink-600 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {BEISPIELE.map((beispiel) => (
            <button
              key={beispiel.kurz}
              type="button"
              onClick={() => setFrage(beispiel.text)}
              className="inline-flex min-h-11 max-w-full items-center rounded-full border border-line-200 px-4 text-left text-xs font-medium text-ink-900 transition hover:border-line-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
            >
              <span className="truncate">{beispiel.kurz}</span>
            </button>
          ))}
        </div>

        {laeuft && (
          <p
            aria-live="polite"
            aria-busy="true"
            className="mt-5 rounded-2xl border border-line-200 bg-surface-25 px-4 py-3 text-sm leading-6 text-brand-900"
          >
            Der Reisebegleiter liest deine Reise und formuliert eine Auskunft …
          </p>
        )}

        {meldung && (
          <div
            role="alert"
            className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
          >
            {meldung}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-line-200 pt-6 sm:flex-row sm:items-center">
          <p className="min-w-0 text-xs leading-5 text-ink-700">
            Der Reisebegleiter ändert, speichert und bucht nichts.
          </p>
          <button
            type="submit"
            disabled={laeuft}
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-brand-800 px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(21,58,51,0.18)] transition hover:-translate-y-0.5 hover:bg-brand-900 disabled:pointer-events-none disabled:opacity-60"
          >
            {laeuft ? 'Auskunft entsteht …' : 'Frage stellen'}
          </button>
        </div>
      </form>

      {auskunft && (
        <section
          aria-labelledby="reisebegleiter-auskunft-titel"
          className="rounded-[28px] border border-line-200 bg-surface-0 p-5 sm:p-7"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
            Generierter Vorschlag
          </p>
          <h3
            id="reisebegleiter-auskunft-titel"
            className="mt-1 text-lg font-semibold tracking-[-0.02em] text-brand-800"
          >
            Auskunft des Reisebegleiters
          </h3>

          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink-900">
            {auskunft.antwort}
          </p>

          {auskunft.unsicherheiten.length > 0 && (
            <div className="mt-5 rounded-2xl border border-line-200 bg-white px-4 py-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-brand-800">
                <AlertTriangle className="h-4 w-4 text-brand-600" aria-hidden="true" />
                Was dafür noch offen ist
              </p>
              <ul className="mt-2 grid gap-1.5">
                {auskunft.unsicherheiten.map((eintrag) => (
                  <li key={eintrag} className="text-sm leading-6 text-ink-800">
                    {eintrag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {auskunft.naechsteSchritte.length > 0 && (
            <div className="mt-4 rounded-2xl border border-line-200 bg-white px-4 py-4">
              <p className="text-sm font-semibold text-brand-800">Mögliche nächste Schritte</p>
              <ul className="mt-2 grid gap-1.5">
                {auskunft.naechsteSchritte.map((eintrag) => (
                  <li key={eintrag} className="text-sm leading-6 text-ink-800">
                    {eintrag}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-5 text-ink-700">
                Vorschläge. Jetnity führt davon nichts selbst aus.
              </p>
            </div>
          )}

          {auskunft.bezuege.length > 0 && (
            <div className="mt-4 rounded-2xl border border-line-200 bg-white px-4 py-4">
              <p className="text-sm font-semibold text-brand-800">Jetnity-Stand dazu</p>
              <ul className="mt-2 grid gap-2">
                {auskunft.bezuege.map((bezug) => (
                  <li key={bezug.ref} className="grid gap-0.5">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-ink-600">
                      {ART_TITEL[bezug.art]}
                    </span>
                    <span className="text-sm font-medium leading-6 text-brand-900">
                      {bezug.titel}
                    </span>
                    <span
                      className={cn(
                        'text-sm leading-6',
                        bezug.belegt ? 'text-ink-800' : 'text-ink-700',
                      )}
                    >
                      {bezug.lage}
                      {bezug.belegt ? null : (
                        <span className="ml-1 whitespace-nowrap text-xs font-medium text-brand-700">
                          · nicht geprüft
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-ink-700">
                <CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
                Diese Zeilen kommen aus Jetnity, nicht aus der Auskunft. „Nicht geprüft" heisst
                nicht „nicht erforderlich".
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-line-200 pt-5 sm:flex-row sm:items-center">
            <p className="min-w-0 text-xs leading-5 text-ink-700">
              Generierter Vorschlag vom Reisebegleiter. Nicht amtlich, nicht vom Anbieter bestätigt.
            </p>
            <button
              type="button"
              onClick={() => {
                setAuskunft(null)
                setMeldung('')
              }}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-line-300 px-5 text-sm font-semibold text-brand-800 transition hover:border-line-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
            >
              Auskunft schliessen
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
