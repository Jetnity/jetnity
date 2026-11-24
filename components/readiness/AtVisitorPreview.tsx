import { ChevronDown, CircleHelp } from 'lucide-react'

import { Hinweis } from '@/components/ui/hinweis'
import type { EinreiseAnzeige, EinreisePaar } from '@/lib/readiness/einreise-kundenanzeige'
import { V3_CUSTOMER_INFORMATION_GROUPS, V3_CUSTOMER_INFORMATION_TOPICS } from '@/lib/readiness/official-truth-product-v3/customer-information/topics'

const NICHT_VERFUEGBAR = 'Derzeit nicht verfügbar'
const AMTLICHE_QUELLEN = [
  { label: 'Österreichisches Innenministerium – Einreise', href: 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html' },
  { label: 'Österreichisches Innenministerium – Visumliste', href: 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html' },
  { label: 'Österreichische Botschaft Bern', href: 'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/' },
] as const

/** A visible, neutral design-system notice in both the entry and result view. */
export function AtVisitorPreviewNotice({ placement }: { placement: 'entry' | 'result' }) {
  return (
    <Hinweis role="note" titel="Dev-Vorschau · Keine Freigabe für Besucher" data-at-visitor-notice={placement}>
      <p>Diese Darstellung ist nur zur Abnahme vorgesehen.</p>
    </Hinweis>
  )
}

function QuellenLink({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer"
    className="inline-flex min-h-11 max-w-full items-center text-sm font-semibold text-foreground underline underline-offset-4 [overflow-wrap:anywhere]">{label}</a>
}

// The existing controller and protected AT API own authority, passport matching
// and expiration. This presentation never reads raw research, source approval
// state or unverified group advice. Only its already filtered visa topic can
// be rendered as confirmed; all other current AT topics remain unavailable.
function BestaetigtesVisum(paar: EinreisePaar, synthetisch: boolean) {
  if (synthetisch || paar.landCode !== 'AT' || paar.ampel !== 'gruen') return undefined
  return paar.themen.find(thema => thema.id === 'visa'
    && thema.status === 'current' && thema.freshness === 'current'
    && thema.result === 'not_required' && Boolean(thema.stand && thema.quelle)
    && AMTLICHE_QUELLEN.some(quelle => quelle.href === thema.quelleHref))
}

export default function AtVisitorPreview({ anzeige, synthetisch = false }: {
  anzeige: EinreiseAnzeige
  synthetisch?: boolean
}) {
  return (
    <section className="grid min-w-0 gap-4 text-foreground" data-at-visitor-preview>
      <AtVisitorPreviewNotice placement="result" />
      <Hinweis titel="Geltungsbereich der Auskunft">
        <p>Die Visumauskunft gilt nur für die gewählte Staatsangehörigkeit, einen gültigen gewöhnlichen Reisepass und die direkte Einreise nach Österreich. Andere Reisedokumente, Reisewege und persönliche Umstände müssen gesondert geprüft werden.</p>
      </Hinweis>
      {anzeige.paare.map(paar => {
        const visum = BestaetigtesVisum(paar, synthetisch)
        return (
          <article key={paar.id} className="grid min-w-0 gap-3 rounded-card border border-border bg-card p-3 sm:p-5 shadow-card" data-at-visitor-pass={paar.id}>
            <header className="grid min-w-0 gap-2">
              <h3 className="text-title [overflow-wrap:anywhere]">Staatsangehörigkeit: {paar.dokument}</h3>
              <div data-at-visitor-visa-status={visum ? 'confirmed' : 'unavailable'} className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="inline-flex max-w-full min-h-8 items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
                  {!visum ? <CircleHelp aria-hidden="true" className="h-4 w-4 shrink-0" /> : null}
                  {visum ? 'Visum nicht erforderlich' : NICHT_VERFUEGBAR}
                </span>
              </div>
              {!visum ? <p className="text-sm leading-6 text-muted-foreground">Für diesen Pass liegt derzeit keine bestätigte persönliche Visumauskunft vor.</p> : null}
            </header>
            <div className="grid min-w-0 gap-2">
              {V3_CUSTOMER_INFORMATION_GROUPS.map(gruppe => {
                const themen = V3_CUSTOMER_INFORMATION_TOPICS.filter(thema => thema.group === gruppe.id)
                return (
                  <details key={gruppe.id} open={gruppe.id === 'permission'} className="min-w-0 rounded-2xl border border-border bg-card" data-at-visitor-group={gruppe.id}>
                    <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-2 px-3 py-3 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                      <span className="grid min-w-0 gap-1 [overflow-wrap:anywhere]">
                        {gruppe.label}
                        {gruppe.id !== 'permission' || !visum ? <span className="text-xs font-normal text-muted-foreground">{NICHT_VERFUEGBAR}</span> : null}
                      </span>
                      <ChevronDown aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                    </summary>
                    <ul className="grid min-w-0 gap-0 divide-y divide-border border-t border-border">
                      {themen.map(thema => {
                        const fakt = thema.id === 'visa' ? visum : undefined
                        return (
                          <li key={thema.id} data-at-visitor-topic={thema.id} data-at-visitor-topic-status={fakt ? 'confirmed' : 'unavailable'}
                            className="grid min-w-0 gap-1 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-x-4">
                            <p className="text-sm font-medium text-foreground [overflow-wrap:anywhere]">{thema.label}</p>
                            <div className="grid min-w-0 gap-1 text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                              <p>{fakt ? fakt.text : NICHT_VERFUEGBAR}</p>
                              {fakt ? <>
                                {fakt.bedingung ? <p>Gilt, wenn: {fakt.bedingung}</p> : null}
                                <p>Geprüft am {fakt.stand}</p>
                                {fakt.quelleHref && fakt.quelle ? <QuellenLink href={fakt.quelleHref} label={fakt.quelle} /> : null}
                              </> : null}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </details>
                )
              })}
            </div>
            <p className="text-xs leading-5 text-muted-foreground [overflow-wrap:anywhere]">Prüfdatum der Visumauskunft: {visum?.stand ?? NICHT_VERFUEGBAR}</p>
          </article>
        )
      })}
      {anzeige.paare.length === 0 ? <Hinweis titel={NICHT_VERFUEGBAR}><p>Wähle einen Pass und frage die Einreiseauskunft erneut ab.</p></Hinweis> : null}
      <section className="grid min-w-0 gap-2 rounded-card border border-border bg-card p-3 sm:p-5" aria-label="Amtliche Quellen">
        <h3 className="text-base font-semibold">Amtliche Quellen</h3>
        <p className="text-sm leading-6 text-muted-foreground">Diese Behördenlinks dienen zur eigenen Prüfung. Sie sind kein Nachweis, dass eine persönliche Einreisebedingung bestätigt ist.</p>
        <ul className="grid min-w-0 gap-1">
          {AMTLICHE_QUELLEN.map(quelle => <li key={quelle.href} className="min-w-0"><QuellenLink href={quelle.href} label={quelle.label} /></li>)}
        </ul>
        <Hinweis titel="Achtung vor inoffiziellen Antragsseiten"><p>Nutze amtliche Direktlinks und prüfe Gebühren bei der zuständigen Behörde, bevor du etwas beantragst oder bezahlst.</p></Hinweis>
      </section>
      <Hinweis titel="Haftungshinweis – Entwurf" data-at-visitor-liability="draft">
        <p>Die Angaben dienen der Reisevorbereitung und sind keine Einreisegarantie. Massgebend sind die zuständigen Behörden. Prüfe die aktuellen Bestimmungen nochmals vor der Abreise.</p>
        <p>Dieser Text ist noch nicht rechtlich geprüft oder zur Veröffentlichung freigegeben.</p>
      </Hinweis>
    </section>
  )
}
