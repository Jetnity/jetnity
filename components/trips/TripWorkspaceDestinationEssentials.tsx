'use client'

import type { DestinationEssentialLink, DestinationEssentialsAbleitung } from '@/lib/trips/destination-essentials'

function ZielName({ name, countryLabel }: { name: string | null; countryLabel: string | null }) {
  if (name && countryLabel) return `${name} · ${countryLabel}`
  if (name) return name
  if (countryLabel) return countryLabel
  return 'Reiseziel'
}

function HinweisLinks({ links }: { links: readonly DestinationEssentialLink[] }) {
  if (links.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}

export default function TripWorkspaceDestinationEssentials({
  essentials,
}: {
  essentials: DestinationEssentialsAbleitung
}) {
  return (
    <section
      aria-labelledby="reiseziele-essentials-titel"
      data-destination-essentials="ein"
      data-destination-search="nein"
      className="rounded-2xl border border-line-200 bg-white px-4 py-4"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Wichtig für deine Ziele</p>
      <h3 id="reiseziele-essentials-titel" className="mt-1 text-base font-semibold tracking-[-0.02em] text-brand-800">
        {essentials.titel}
      </h3>
      {!essentials.hatZiele ? (
        <p className="mt-1 text-sm leading-6 text-ink-800">{essentials.leerText}</p>
      ) : (
        <ul className="mt-3 grid gap-3">
          {essentials.ziele.map((ziel) => (
            <li key={ziel.stageId}>
              <article
                data-destination-stage={ziel.stageId}
                data-destination-country={ziel.countryCode ?? 'none'}
                data-destination-entry={ziel.einreise.lage}
                data-destination-safety={ziel.sicherheit.lage}
                data-destination-seasonal={ziel.saison.lage}
                className="rounded-2xl border border-line-200 bg-surface-25 px-3 py-3"
              >
                <h4 className="text-sm font-semibold text-brand-800">
                  <ZielName name={ziel.name} countryLabel={ziel.countryLabel} />
                </h4>
                {ziel.zeitraumText ? (
                  <p className="mt-1 text-xs leading-5 text-ink-800">{ziel.zeitraumText}</p>
                ) : null}
                <dl className="mt-3 grid gap-2">
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-600">Einreise</dt>
                    <dd className="mt-0.5 text-sm leading-6 text-ink-800">{ziel.einreise.text}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-600">Sicherheit</dt>
                    <dd className="mt-0.5 text-sm leading-6 text-ink-800">{ziel.sicherheit.text}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-600">Reisezeit</dt>
                    <dd className="mt-0.5 text-sm leading-6 text-ink-800">{ziel.saison.text}</dd>
                  </div>
                </dl>
                {ziel.hatHinweise ? (
                  <details className="mt-3">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center text-xs font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15">
                      Quellen und Details
                    </summary>
                    <div className="mt-2 grid gap-3">
                      {[
                        { titel: 'Einreise', bereich: ziel.einreise },
                        { titel: 'Sicherheit', bereich: ziel.sicherheit },
                        { titel: 'Reisezeit', bereich: ziel.saison },
                      ].map(({ titel, bereich }) =>
                        bereich.details.length > 0 || bereich.links.length > 0 ? (
                          <div key={titel}>
                            <p className="text-xs font-semibold text-brand-800">{titel}</p>
                            {bereich.details.map((detail) => (
                              <p key={detail.id} className="mt-1 text-xs leading-5 text-ink-800">
                                {detail.titel}: {detail.text}
                                {detail.dokumentLabel ? ` · ${detail.dokumentLabel}` : ''}
                                {detail.kontextText ? ` · ${detail.kontextText}` : ''}
                              </p>
                            ))}
                            <HinweisLinks links={bereich.links} />
                          </div>
                        ) : null,
                      )}
                    </div>
                  </details>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
