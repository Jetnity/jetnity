'use client'

// W2 #1299: Darstellung der bereits berechneten Hinweise. Status, Link und
// Preistext werden nur gezeigt, nicht neu bestimmt.
import { buchungsHinweise } from '@/lib/reiseaenderung/direct/buchungs-hinweise'
import type { Trip } from '@/types/trips'

// Der bestehende TripItem-Vertrag enthält keinen geprüften Preis-Abrufzeitpunkt.
// Niemals anhand von Datums-/Uhrzeit-Mustern im freien Preistext Frische ableiten.
export default function ReiseAenderungBuchungshinweise({ vorher, nachher }: { vorher: Trip; nachher: Trip }) {
  const hinweise = buchungsHinweise(vorher, nachher)
  if (hinweise.length === 0) return null
  return (
    <section aria-label="Angebote und gebuchte Leistungen prüfen" className="grid min-w-0 gap-4">
      <div className="min-w-0">
        <h3 className="break-words text-base font-semibold leading-6 text-brand-900 sm:text-lg">
          Welche Angebote oder Buchungen sind betroffen?
        </h3>
        <p className="mt-2 max-w-prose break-words text-sm leading-6 text-ink-800">
          Deine Planung kann sich ändern. Jetnity bucht, storniert oder ändert nichts beim Anbieter.
          «Als gebucht markiert» ist deine eigene Angabe und keine Bestätigung des Anbieters.
        </p>
      </div>
      <ul className="grid min-w-0 gap-3">
        {hinweise.map(hinweis => {
          const markiert = hinweis.status === 'vom_nutzer_markiert'
          return (
            <li
              key={hinweis.id}
              data-w2-buchungs-hinweis={hinweis.status}
              className={`min-w-0 overflow-hidden rounded-2xl border p-4 sm:p-5 ${markiert
                ? 'border-status-achtung-line bg-status-achtung-soft'
                : 'border-status-neutral-line bg-status-neutral-soft'}`}
            >
              <p className="break-words text-base font-semibold leading-6 text-brand-900">{hinweis.titel}</p>
              <p className={`mt-3 inline-flex max-w-full break-words rounded-full border bg-white px-3 py-2 text-sm font-semibold leading-5 ${markiert
                ? 'border-status-achtung-line text-status-achtung'
                : 'border-status-neutral-line text-status-neutral'}`}>
                {hinweis.label}
              </p>
              <dl className="mt-4 grid min-w-0 gap-3 text-sm leading-6 md:grid-cols-2">
                <div className="min-w-0 rounded-xl bg-white p-3">
                  <dt className="font-semibold text-brand-900">Vorher</dt>
                  <dd className="mt-1 break-words text-ink-900">
                    <span className="sr-only">Bisher. </span>
                    {hinweis.vorher}
                  </dd>
                </div>
                <div className="min-w-0 rounded-xl bg-white p-3">
                  <dt className="font-semibold text-brand-900">Nachher</dt>
                  <dd className="mt-1 break-words text-ink-900">
                    <span className="block text-ink-800">Nach deiner geplanten Änderung</span>
                    {hinweis.nachher}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 min-w-0 rounded-xl border border-line-200 bg-white p-3">
                <p className="text-sm font-semibold text-brand-900">Preisstand</p>
                <p className="mt-1 break-words text-sm leading-6 text-ink-900">{hinweis.preisHinweis}</p>
                <div className="mt-3 break-words border-t border-line-200 pt-3 text-sm font-semibold leading-6 text-ink-900">
                  <p>Preisstand mit Datum/Uhrzeit nicht verfügbar</p>
                </div>
              </div>
              <h4 className="mt-4 break-words text-sm font-semibold leading-6 text-brand-900">Was muss ich jetzt tun?</h4>
              <p className="mt-1 break-words text-sm leading-6 text-ink-900">{hinweis.handlung}</p>
              {hinweis.link ? (
                <a
                  href={hinweis.link}
                  target="_blank"
                  rel="noopener noreferrer nofollow sponsored"
                  className="mt-4 inline-flex min-h-11 w-full max-w-full items-center justify-center break-words rounded-xl border border-line-300 bg-white px-4 py-2 text-center text-sm font-semibold text-brand-800 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:w-auto sm:justify-start sm:text-left"
                >
                  Gespeicherten Anbieterlink öffnen
                  <span className="sr-only">, öffnet in einem neuen Fenster und bucht nichts</span>
                </a>
              ) : (
                <p className="mt-3 break-words text-sm leading-6 text-ink-800">Kein geeigneter gespeicherter Anbieterlink vorhanden.</p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
