'use client'

// W2 #1299: separate offer/booking labels, grounded price date evidence and
// practical next steps. A link is shown only after the pure provider-host gate.
import { buchungsHinweise } from '@/lib/reiseaenderung/direct/buchungs-hinweise'
import type { Trip } from '@/types/trips'

export default function ReiseAenderungBuchungshinweise({ vorher, nachher }: { vorher: Trip; nachher: Trip }) {
  const hinweise = buchungsHinweise(vorher, nachher)
  if (hinweise.length === 0) return null
  return <section aria-label="Angebote und gebuchte Leistungen prüfen" className="grid min-w-0 gap-3">
    <div>
      <h3 className="text-base font-semibold text-brand-900">Welche Angebote oder Buchungen sind betroffen?</h3>
      <p className="mt-1 text-sm leading-6 text-ink-800">
        Deine Planung kann sich ändern. Jetnity bucht, storniert oder ändert nichts beim Anbieter.
        «Als gebucht markiert» ist deine eigene Angabe und keine Bestätigung des Anbieters.
      </p>
    </div>
    <ul className="grid gap-3">
      {hinweise.map(hinweis => <li key={hinweis.id} data-w2-buchungs-hinweis={hinweis.status}
        className={`min-w-0 rounded-2xl border p-4 ${hinweis.status === 'vom_nutzer_markiert'
          ? 'border-status-achtung-line bg-status-achtung-soft'
          : 'border-line-200 bg-surface-25'}`}>
        <p className="break-words font-semibold text-brand-900">{hinweis.titel}</p>
        <p className={`mt-2 inline-flex max-w-full rounded-full px-3 py-1 text-xs font-semibold ${hinweis.status === 'vom_nutzer_markiert'
          ? 'bg-white text-status-achtung'
          : 'bg-white text-brand-800'}`}>
          {hinweis.label}
        </p>
        <dl className="mt-3 grid gap-2 text-sm leading-6 text-ink-900">
          <div><dt className="font-semibold">Bisher</dt><dd className="break-words">{hinweis.vorher}</dd></div>
          <div><dt className="font-semibold">Nach deiner geplanten Änderung</dt><dd className="break-words">{hinweis.nachher}</dd></div>
        </dl>
        <p className="mt-3 text-sm leading-6 text-ink-800">{hinweis.preisHinweis}</p>
        <p className="mt-3 text-sm font-semibold leading-6 text-brand-900">Das kannst du jetzt tun:</p>
        <p className="text-sm leading-6 text-ink-900">{hinweis.handlung}</p>
        {hinweis.link ? <a href={hinweis.link} target="_blank" rel="noopener noreferrer nofollow sponsored"
          className="mt-3 inline-flex min-h-11 max-w-full items-center rounded-xl border border-line-300 bg-white px-4 py-2 text-sm font-semibold text-brand-800 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
          Gespeicherten Anbieterlink öffnen
        </a> : <p className="mt-2 text-xs leading-5 text-ink-700">Kein geeigneter gespeicherter Anbieterlink vorhanden.</p>}
      </li>)}
    </ul>
  </section>
}
