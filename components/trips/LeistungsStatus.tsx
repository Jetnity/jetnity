import { StatusSiegel } from '@/components/ui/status-siegel'
import { Preis } from '@/components/ui/preis'
import { gespeicherterPreis } from '@/lib/trips/kostenbild'
import { W3_STATUS_TEXT, W3_PREIS_HINWEIS, W3_PREIS_UNBEKANNT, preisstandText, type AktuellerLeistungsstand } from '@/lib/trips/angebot-buchung-anzeige'
import type { TripItem } from '@/types/trips'

export function LeistungsStatus({ stand }: { stand: AktuellerLeistungsstand }) {
  return <span data-w3-leistungsstand={stand} className="inline-flex min-w-0 max-w-full">
    <StatusSiegel ton={stand === 'vom_nutzer_markiert' ? 'gebucht' : 'gewaehlt'} className="min-w-0 whitespace-normal break-words text-left">{W3_STATUS_TEXT[stand]}</StatusSiegel>
  </span>
}

export function PreisstandHinweis({ suchzeit }: { suchzeit?: number | null }) {
  const text = preisstandText(suchzeit)
  return <span data-w3-preisstand={text === W3_PREIS_UNBEKANNT ? 'unbekannt' : 'suche'} className="block min-w-0 max-w-prose break-words text-meta text-muted-foreground [overflow-wrap:anywhere]">
    {text}. {W3_PREIS_HINWEIS}
  </span>
}

export function GespeicherterPreisstand({ punkt }: { punkt: Pick<TripItem, 'priceAmount' | 'priceCurrency'> }) {
  const preis = gespeicherterPreis(punkt)
  return <span className="mt-1 block min-w-0 break-words">
    {preis.art === 'preis' ? <span className="block text-meta text-foreground">Gespeicherter Betrag: <Preis betrag={preis.betrag} waehrung={preis.waehrung} className="font-semibold" /></span> : null}
    <PreisstandHinweis />
  </span>
}

export function ExterneAngeboteHinweis() {
  return <div className="my-2 grid min-w-0 gap-1 rounded-control border border-border bg-card p-3 text-meta text-card-foreground">
    <LeistungsStatus stand="unverbindliches_angebot" />
    <p className="max-w-prose break-words">Preise und Verfügbarkeit in externen Suchansichten stammen vom jeweiligen Anbieter. Jetnity kann den Preisstand einzelner Angebote hier nicht belegen. Eine Suche, Auswahl oder Weiterleitung ist keine Buchungsbestätigung.</p>
    <PreisstandHinweis />
  </div>
}
