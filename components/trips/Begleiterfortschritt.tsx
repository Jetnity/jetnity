'use client'

// Orientierung während einer Reisebegleiter-Anfrage – keine Echtzeittelemetrie.
// Das Modell wählt aus von Jetnity berechneten Aussagen, es verfasst keine
// eigenen amtlichen Texte. Ohne tatsächliche Phasenmeldungen vom Server dürfen
// wir einzelne Schritte nicht als abgeschlossen oder gerade aktiv behaupten.

const SCHRITTE = [
  'Den gespeicherten Reisebestand berücksichtigen',
  'Zutreffende Jetnity-Aussagen auswählen',
  'Die ausgewählte Auskunft vor der Anzeige prüfen',
] as const

export default function Begleiterfortschritt() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="rounded-2xl border border-line-200 bg-surface-25 px-4 py-4 sm:px-5"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">
        Jetnity bereitet deine Auskunft vor
      </p>
      <p className="mt-2 flex items-center gap-3 text-sm font-medium leading-6 text-brand-900">
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 shrink-0 rounded-full bg-citrus-400 motion-safe:animate-pulse"
        />
        Deine Frage wird bearbeitet …
      </p>
      <ol className="mt-4 grid gap-2">
        {SCHRITTE.map((text) => (
          <li key={text} className="flex min-w-0 items-start gap-3">
            <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-line-300" />
            <span className="min-w-0 text-sm leading-6 text-ink-800 [overflow-wrap:anywhere]">
              {text}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs leading-5 text-ink-700">
        Die Schritte dienen zur Orientierung und zeigen keinen gemessenen Live-Fortschritt.
      </p>
    </div>
  )
}
