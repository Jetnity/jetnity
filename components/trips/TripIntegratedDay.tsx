'use client'

import * as React from 'react'
import { betragLesbar } from '@/lib/trips/bezeichnungen'
import { aenderungsAuswirkung, gespeicherteKosten, planSnapshot, tagesOrte, vorbereitungenFuerPunkt, type PlanSnapshot } from '@/lib/trips/trip-plan-integrated/day'
import { ManuelleVerbindung } from '@/components/trips/MobilitaetBereich'
import type { MobilityManuellEingabe } from '@/lib/mobility/schema'
import { tripMovements } from '@/lib/trips/trip-plan-integrated/movements'
import { tripGapContext } from '@/lib/trips/trip-plan-integrated/live'
import { externalDefault } from '@/lib/trips/trip-plan-integrated/external'
import type { ReadinessViewItem } from '@/lib/readiness/domain'
import type { PreparationZiel } from '@/lib/readiness/preparation-premium-experience-5'
import type { Trip, TripItem } from '@/types/trips'

const action='inline-flex min-h-11 items-center rounded-full border border-line-200 px-3 py-2 text-left text-sm font-semibold text-brand-800 focus-visible:ring-4 focus-visible:ring-brand-600/15'
const summary='min-h-11 cursor-pointer py-3 text-sm font-semibold text-brand-800 focus-visible:ring-4 focus-visible:ring-brand-600/15'
export default function TripIntegratedDay({reise,dayId,ordered,selected,tasks=[],onItem,onPreparation,onVerbindungAnlegen}: {
  reise:Trip;dayId:string;ordered:readonly TripItem[];selected?:string;tasks?:readonly ReadinessViewItem[];
  onItem?:(id:string)=>void;onPreparation?:(ziel:PreparationZiel)=>void;onVerbindungAnlegen?:(values:MobilityManuellEingabe)=>Promise<string|null>
}) {
  const [movement,setMovement]=React.useState<string|null>(null)
  const costs=gespeicherteKosten(reise,dayId), unassigned=gespeicherteKosten(reise,null)
  const places=tagesOrte(reise,dayId,ordered)
  const movements=tripMovements(reise)
  const time=tripGapContext(reise,dayId)
  const relevant=new Set(ordered.map(item=>item.id))
  const needs=movements.results.filter(r=>relevant.has(r.sourceItemId))
  const checks=ordered.flatMap(item=>vorbereitungenFuerPunkt(item.id,tasks).map(task=>({...task,item})))
  const next=ordered[ordered.findIndex(item=>item.id===selected)+1]
  const snapshot=JSON.stringify(planSnapshot(reise))
  const [history,setHistory]=React.useState<{snapshot:string;impact:ReturnType<typeof aenderungsAuswirkung>}>({snapshot,impact:null})
  if (history.snapshot!==snapshot) setHistory({snapshot,impact:aenderungsAuswirkung(JSON.parse(history.snapshot) as PlanSnapshot,JSON.parse(snapshot) as PlanSnapshot)})
  const impact=history.impact
  return <section aria-label="Tagesüberblick" data-integrated-day className="mt-4 min-w-0 rounded-2xl bg-surface-50 px-4 py-2">
    <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2 py-2">
      <p className="text-sm font-semibold text-brand-800">Gespeicherte Preise{!costs.complete ? ' · unvollständig' : ''}</p>
      <p data-day-costs className="text-sm text-ink-800">{costs.totals.map(total=>betragLesbar(total.amount,total.currency)).join(' · ') || 'Noch keine Beträge'}</p>
    </div>
    {next && onItem && <div className="border-t border-line-200 py-2"><p className="text-xs text-ink-700">Geplante Reihenfolge · keine Echtzeitangabe</p>
      <button type="button" className={action} onClick={()=>onItem(next.id)}>Nächster Punkt im Plan: {next.title}</button></div>}
    {impact && (impact.changed.length>0 || impact.summaryChanged) && <details className="border-t border-line-200" data-plan-impact>
      <summary className={summary}>Gespeicherter Plan geändert · {impact.count} nachgewiesene Folgepunkte</summary>
      <p className="text-sm leading-6 text-ink-700">{impact.count} verknüpfte Vorbereitungspunkte prüfen. Preise und Orte wurden neu ausgewertet. Weitere Beziehungen sind nicht vollständig belegt. Deine Buchungen und Häkchen bleiben unverändert.</p>
      <ul className="py-2 text-sm">{impact.targets.map(target=><li key={target.id}>Vorbereitung · {target.reasons.map(id=>ordered.find(item=>item.id===id)?.title ?? 'Geänderter Planpunkt').join(', ')}</li>)}</ul>
    </details>}
    <details className="border-t border-line-200"><summary className={summary}>Preise aufschlüsseln</summary>
      <p className="text-xs leading-5 text-ink-700">Voller gespeicherter Preis je eindeutigem Punkt, einmal am zugeordneten Tag. Mehrtägige Aufenthalte werden nicht auf Nächte verteilt. Keine Aussage über Zahlung oder aktuelle Verfügbarkeit.</p>
      <ul className="my-3 space-y-2 text-sm">{costs.items.map(item=><li key={item.id} className="flex min-w-0 flex-wrap justify-between gap-2"><span>{item.title}</span><span>{costs.totals.some(total=>total.itemIds.includes(item.id)) && item.priceAmount!==null && item.priceCurrency ? betragLesbar(item.priceAmount,item.priceCurrency) : 'Preis fehlt oder ist ungültig'}</span></li>)}</ul>
      <p className="text-xs text-ink-700">{costs.missing} Preise fehlen · {costs.invalid} ungültig · {costs.ambiguous.length} mehrdeutige Kennungen</p>
      {unassigned.items.length>0 && <p className="my-3 text-sm">Noch keinem Tag zugeordnet: {unassigned.totals.map(total=>betragLesbar(total.amount,total.currency)).join(' · ') || 'Kein gültiger Betrag'}{!unassigned.complete ? ' · unvollständig' : ''}. Diese Beträge sind nicht in der Tagessumme enthalten.</p>}
    </details>
    <details className="border-t border-line-200" data-day-places><summary className={summary}>Orte ansehen</summary>
      {places.stage && <p className="text-sm text-ink-800">Etappenort: {places.stage.label}{!places.stage.point?' · Koordinaten unbekannt':''}</p>}
      {places.stage?.point && <svg viewBox="0 0 360 160" role="img" aria-label={`Schematische Weltposition des Etappenorts ${places.stage.label}; keine Straßenroute`} className="my-3 max-h-48 w-full rounded-xl bg-white">
        <path d="M0 80H360M180 0V160" stroke="currentColor" className="text-line-200" />
        <circle cx={(places.stage.point.longitude+180)} cy={(90-places.stage.point.latitude)*160/180} r="5" fill="currentColor" className="text-brand-700" />
      </svg>}
      <p className="my-2 text-xs leading-5 text-ink-700">Etappenkoordinaten sind keine Treffpunkte. Schematische Orientierung ohne Straßenroute oder geprüfte Wegezeit.</p>
      <ol className="my-3 list-inside list-decimal space-y-2 text-sm">{places.stops.map(stop=><li key={stop.id}><span className="font-medium">{stop.title}</span> · {stop.description}</li>)}</ol>
    </details>
    {checks.length>0 && <details className="border-t border-line-200"><summary className={summary}>Vorbereitung zu diesem Tag · {new Set(checks.map(x=>x.id)).size} Prüfungen</summary>
      <p className="text-xs leading-5 text-ink-700">Persönliche Bestätigungen sind keine offizielle Einreisefreigabe. Der aktuelle Stand bleibt in Vorbereitung sichtbar.</p>
      <ul className="my-3 space-y-2">{checks.map(check=><li key={check.id}><button type="button" className={action} onClick={()=>onPreparation?.(check.ziel)}>{check.item.title}: {check.title}</button></li>)}</ul>
    </details>}
    <details className="border-t border-line-200"><summary className={summary}>Verbindungen und Zeitgrundlage</summary>
      <p className="text-xs leading-5 text-ink-700">Keine Zielort-Zeitzone oder geprüfte aktuelle Zeit hinterlegt. Die Reihenfolge dient der Navigation. Zeitlücken sind nicht automatisch nutzbare freie Zeit; es gilt kein pauschaler Flughafenpuffer.</p>
      {needs.map(need=><div key={need.id} className="my-3 text-sm"><p>{need.state==='missing_in_plan'?'Transfer fehlt im Plan':need.state==='present_in_plan'?'Verbindung im Plan':'Transfer noch nicht prüfbar'}</p>
        {need.state==='missing_in_plan' && onVerbindungAnlegen && <button className={action} type="button" onClick={()=>setMovement(need.id)}>Verbindung ergänzen</button>}</div>)}
      {movement && onVerbindungAnlegen && (()=>{
        const need=movements.needs.find(n=>n.id===movement)
        if (!need?.from || !need.to || !relevant.has(need.sourceItemId)) return null
        return <div className="my-3"><p className="text-xs">Editierbarer Vorschlag aus der gespeicherten Flugroute. Wird erst beim Speichern übernommen.</p>
          <ManuelleVerbindung key={`${movement}:${dayId}`} reise={reise} onAnlegen={onVerbindungAnlegen}
            vorgabe={{mode:'transfer',originName:need.from.id,destinationName:need.to.id,
              originPlaceId:`airport:${need.from.id}`,destinationPlaceId:`airport:${need.to.id}`,dayId,startsOn:null}} />
          <button type="button" className={action} onClick={()=>setMovement(null)}>Verbindung schließen</button></div>
      })()}
      {!needs.length && <p className="my-3 text-sm">Eine genaue Verbindungszuordnung ist für diese Punkte noch nicht belegt.</p>}
      {time.groups.map(group=><div key={group.contextRef} className="my-3 text-sm"><p>Zwischen den eingetragenen Ortszeiten ({group.contextRef}):</p>
        {group.gaps.map(gap=><p key={gap.start}>{gap.end-gap.start} Ortszeit-Minuten Abstand. Nutzbare Zeit unklar.</p>)}
        {!group.gaps.length && <p>Keine Lücke zwischen den vergleichbaren Einträgen.</p>}
        {!group.complete && <p>Weitere Verpflichtungen oder Zeitbezüge sind offen.</p>}</div>)}
    </details>
    <details className="border-t border-line-200"><summary className={summary}>Optionaler externer Kontext</summary>
      <p className="pb-3 text-xs leading-5 text-ink-700">Wetter, Öffnungszeiten und Verkehrswege: {externalDefault('weather').reason} Deine Notizen sind keine bestätigten Reservierungen.</p>
    </details>
  </section>
}
