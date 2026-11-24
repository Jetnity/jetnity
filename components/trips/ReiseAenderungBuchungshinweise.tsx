'use client'

// W2 #1299: Darstellung der bereits berechneten Hinweise. Status, Link und
// Preistext werden nur gezeigt, nicht neu bestimmt.
import { buchungsHinweise } from '@/lib/reiseaenderung/direct/buchungs-hinweise'
import { Hinweis } from '@/components/ui/hinweis'
import { Karte } from '@/components/ui/karte'
import { StatusSiegel } from '@/components/ui/status-siegel'
import type { Trip } from '@/types/trips'

// Der bestehende TripItem-Vertrag enthält keinen geprüften Preis-Abrufzeitpunkt.
// Niemals anhand von Datums-/Uhrzeit-Mustern im freien Preistext Frische ableiten.
const linkKlasse = 'inline-flex min-h-11 w-full max-w-full items-center justify-center rounded-full border border-input bg-background px-4 py-2 text-center text-body font-semibold text-foreground underline-offset-4 motion-safe:active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto'

export default function ReiseAenderungBuchungshinweise({ vorher, nachher }: { vorher: Trip; nachher: Trip }) {
  const hinweise = buchungsHinweise(vorher, nachher)
  if (hinweise.length === 0) return null
  return (
    <section aria-label="Angebote und gebuchte Leistungen prüfen" className="grid min-w-0 gap-4">
      <div className="min-w-0">
        <h3 className="break-words text-title text-foreground">Welche Angebote oder Buchungen sind betroffen?</h3>
        <p className="mt-2 max-w-prose break-words text-body text-muted-foreground">
          Deine Planung kann sich ändern. Jetnity bucht, storniert oder ändert nichts beim Anbieter.
          «Als gebucht markiert» ist deine eigene Angabe und keine Bestätigung des Anbieters.
        </p>
      </div>
      <ul className="grid min-w-0 gap-4">
        {hinweise.map(hinweis => {
          const markiert = hinweis.status === 'vom_nutzer_markiert'
          return (
            <li key={hinweis.id} data-w2-buchungs-hinweis={hinweis.status} className="min-w-0">
              <Karte className="grid gap-4 p-4 sm:p-5">
                <div className="grid min-w-0 gap-3">
                  <h4 className="break-words text-subtitle text-card-foreground">{hinweis.titel}</h4>
                  <StatusSiegel ton={markiert ? 'gebucht' : 'gewaehlt'}>{hinweis.label}</StatusSiegel>
                </div>
                <dl className="grid min-w-0 gap-3 md:grid-cols-2">
                  <div className="min-w-0 rounded-control bg-muted px-3 py-3">
                    <dt className="text-meta font-semibold text-foreground">Vorher</dt>
                    <dd className="mt-1 break-words text-body text-card-foreground">
                      <span className="sr-only">Bisher. </span>
                      {hinweis.vorher}
                    </dd>
                  </div>
                  <div className="min-w-0 rounded-control bg-muted px-3 py-3">
                    <dt className="text-meta font-semibold text-foreground">Nachher</dt>
                    <dd className="mt-1 break-words text-body text-card-foreground">
                      <span className="block text-meta text-muted-foreground">Nach deiner geplanten Änderung</span>
                      {hinweis.nachher}
                    </dd>
                  </div>
                </dl>
                <Hinweis ton="info" className="border-status-neutral-line bg-status-neutral-soft">
                  <p className="font-semibold">Preisstand</p>
                  <p>{hinweis.preisHinweis}</p>
                  <p className="font-semibold">Preisstand mit Datum/Uhrzeit nicht verfügbar</p>
                  <p className="font-semibold">Preis kann sich ändern</p>
                </Hinweis>
                <Hinweis
                  ton="aufgabe"
                  titel="Was muss ich jetzt tun?"
                  className="border-status-achtung-line bg-status-achtung-soft"
                  aktion={hinweis.link ? (
                    <a href={hinweis.link} target="_blank" rel="noopener noreferrer nofollow sponsored" className={linkKlasse}>
                      Gespeicherten Anbieterlink öffnen
                      <span className="sr-only">, öffnet in einem neuen Fenster und bucht nichts</span>
                    </a>
                  ) : undefined}
                >
                  <p>{hinweis.handlung}</p>
                  {hinweis.link ? null : <p>Kein geeigneter gespeicherter Anbieterlink vorhanden.</p>}
                </Hinweis>
              </Karte>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
