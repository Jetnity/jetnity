import type { ReactNode } from 'react'

import { SEO_STATUS_TEXTE, type SeoStatusStand } from '@/lib/admin/seo-status'

function Zeile({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-foreground">{label}</dt>
      <dd className="mt-1 min-w-0 text-sm text-muted-foreground">{children}</dd>
    </div>
  )
}

export default function IndexingStatus({ stand }: { stand: SeoStatusStand }) {
  return (
    <section
      className="min-w-0 rounded-2xl border border-border bg-card p-4 md:p-5"
      aria-labelledby="indexierungs-konfiguration-titel"
      data-indexing-status=""
      data-indexing-decision={stand.entscheidung}
      data-indexing-origin-source={stand.originQuelle}
      data-indexing-sitemap-count={String(stand.sitemapAnzahl)}
      data-indexing-health-green="false"
    >
      <header className="min-w-0 space-y-2">
        <h2
          id="indexierungs-konfiguration-titel"
          className="text-lg font-semibold tracking-tight md:text-xl"
        >
          {SEO_STATUS_TEXTE.titel}
        </h2>
        <p className="text-sm text-muted-foreground">{stand.standHinweis}</p>
      </header>

      <dl className="mt-4 grid gap-4 min-w-0 sm:grid-cols-2">
        <Zeile label={SEO_STATUS_TEXTE.technischeOrigin}>
          <span className="block min-w-0 break-all font-mono text-xs sm:text-sm">
            {stand.technischeOrigin}
          </span>
        </Zeile>
        <Zeile label={SEO_STATUS_TEXTE.originQuelle}>{stand.originQuelleLabel}</Zeile>
        <Zeile label={SEO_STATUS_TEXTE.kanonischeOrigin}>
          <span className="block min-w-0 break-all font-mono text-xs sm:text-sm">
            {stand.kanonischeProduktOrigin}
          </span>
        </Zeile>
        <Zeile label={SEO_STATUS_TEXTE.entscheidung}>
          <span className="inline-flex rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
            {stand.entscheidungLabel}
          </span>
          <p className="mt-2 text-xs leading-5">{stand.entscheidungHinweis}</p>
        </Zeile>
        <Zeile label={SEO_STATUS_TEXTE.htmlRobots}>
          <span className="font-mono text-xs sm:text-sm">{stand.htmlRobots}</span>
        </Zeile>
        <Zeile label={SEO_STATUS_TEXTE.sitemap}>
          {stand.sitemapBeworben
            ? SEO_STATUS_TEXTE.sitemapBeworben
            : SEO_STATUS_TEXTE.sitemapNichtBeworben}
          {stand.sitemapUrl ? (
            <span className="mt-1 block min-w-0 break-all font-mono text-xs">{stand.sitemapUrl}</span>
          ) : null}
        </Zeile>
        <div className="min-w-0 sm:col-span-2">
          <dt className="text-xs font-medium text-foreground">{SEO_STATUS_TEXTE.robots}</dt>
          <dd className="mt-1 min-w-0">
            <ul className="flex flex-wrap gap-1.5">
              {stand.robotsDisallow.map((pfad) => (
                <li
                  key={pfad}
                  className="max-w-full break-all rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs"
                >
                  {pfad}
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div className="min-w-0 sm:col-span-2">
          <dt className="text-xs font-medium text-foreground">{SEO_STATUS_TEXTE.sitemapUrls}</dt>
          <dd className="mt-1 min-w-0 text-sm text-muted-foreground">
            {stand.sitemapUrls.length === 0 ? (
              <p>{stand.sitemapHinweis}</p>
            ) : (
              <ul className="space-y-1">
                {stand.sitemapUrls.map((url) => (
                  <li key={url} className="min-w-0 break-all font-mono text-xs sm:text-sm">
                    {url}
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-xs leading-5 text-muted-foreground">{stand.grenze}</p>
    </section>
  )
}
