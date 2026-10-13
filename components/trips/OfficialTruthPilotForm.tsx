'use client'
import * as React from 'react'
import type { Trip } from '@/types/trips'
import { declarationReferencesValid, pilotContextCurrent, type PilotDeclaration } from '@/lib/readiness/official-truth-ch-de-application-pilot-1/context'
import { pilotMessages, type PilotStatus } from '@/lib/readiness/official-truth-ch-de-application-pilot-1/result'

const empty: PilotDeclaration = { travellerClientRef: null, documentClientRef: null, citizenshipClientRef: null,
  credentialOptionRef: null, passportClass: null, purpose: null, originCountryCode: null, route: null }
const field = 'min-h-11 w-full rounded-xl border border-line-300 bg-surface-0 px-3 py-2 text-base text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600'
export default function OfficialTruthPilotForm({ trip, status, busy, error, onChange, onSave, onCheck }: {
  trip: Trip; status: PilotStatus | 'checking' | 'expired'; busy: boolean; error: string;
  onChange: () => void; onSave: (declaration: PilotDeclaration) => Promise<boolean>; onCheck: () => void;
}) {
  const [declaration,setDeclaration] = React.useState<PilotDeclaration>(trip.regulatoryContext?.declaration ?? empty)
  const [dirty,setDirty] = React.useState(false)
  const options = (trip.party ?? []).flatMap((t,index) => t.documents.flatMap(d => {
    const citizenship=t.citizenships.find(c => c.clientRef===d.citizenshipClientRef)
    if (!citizenship) return []
    return [{ ref: `${t.clientRef}:${d.clientRef}`, traveller: t.clientRef, document: d.clientRef,
      citizenship: citizenship.clientRef, label: `${t.label || `Reisende ${index+1}`} · ${d.documentType==='passport' ? 'Reisepass' : 'Dokument'} ${d.issuingCountryCode ?? 'Land unbekannt'} · Staatsbürgerschaft ${citizenship.countryCode} · ${d.expiresOn ? `gültig bis ${d.expiresOn}` : 'Ablauf unbekannt'}` }]
  }))
  const change = (next: PilotDeclaration) => { setDeclaration(next);setDirty(true);onChange() }
  const current=pilotContextCurrent(trip) && declarationReferencesValid(trip,declaration)
  const message = dirty ? 'Angaben geändert. Speichere sie vor einer neuen Prüfung.'
    : status==='checking' ? 'Aktuelle Quelle wird geprüft …'
      : status==='expired' ? 'Die Anzeige ist abgelaufen. Eine neue freigegebene Prüfung ist erforderlich.'
        : pilotMessages[status]
  return <section className="rounded-2xl border border-line-200 bg-surface-25 p-4 sm:p-6" aria-labelledby="official-pilot-title">
    <h3 id="official-pilot-title" className="text-lg font-semibold text-brand-800">Angaben zur CH–DE-Prüfung</h3>
    <p className="mt-2 text-sm leading-6 text-ink-900">Deine Erklärungen zur Reise sind keine Behördenauskunft. Der Pilot prüft ausschliesslich eine Visumfrage für einen gewöhnlichen Schweizer Reisepass, Tourismus und eine vollständige direkte Reise von der Schweiz nach Deutschland.</p>
    <form className="mt-4 space-y-4" onSubmit={async event => { event.preventDefault(); if (await onSave(declaration)) setDirty(false) }}>
      <label className="block text-sm font-medium text-brand-800">Reisende Person und verknüpftes Dokument
        <select className={`${field} mt-1`} value={declaration.credentialOptionRef ?? ''} onChange={e => {
          const selected=options.find(o => o.ref===e.target.value)
          change({ ...declaration, travellerClientRef: selected?.traveller ?? null, documentClientRef: selected?.document ?? null,
            citizenshipClientRef: selected?.citizenship ?? null, credentialOptionRef: selected?.ref ?? null, passportClass: null })
        }}>
          <option value="">Bitte ausdrücklich auswählen</option>
          {options.map(o => <option key={o.ref} value={o.ref}>{o.label}</option>)}
        </select>
      </label>
      {options.length===0 && <p className="text-sm text-ink-900">Ergänze unter Reisende eine Staatsbürgerschaft und ein damit verknüpftes Dokument.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-brand-800">Passart
          <select className={`${field} mt-1`} value={declaration.passportClass ?? ''} onChange={e => change({ ...declaration,passportClass: e.target.value as PilotDeclaration['passportClass'] || null })}>
            <option value="">Nicht angegeben</option><option value="ordinary">Gewöhnlicher Reisepass</option><option value="other">Andere Passart</option><option value="unknown">Unbekannt</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-brand-800">Reisezweck
          <select className={`${field} mt-1`} value={declaration.purpose ?? ''} onChange={e => change({ ...declaration,purpose: e.target.value as PilotDeclaration['purpose'] || null })}>
            <option value="">Nicht angegeben</option><option value="tourism">Tourismus</option><option value="other">Anderer Zweck</option><option value="unknown">Unbekannt</option>
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium text-brand-800">Abreiseland
        <select className={`${field} mt-1`} value={declaration.originCountryCode ?? ''} onChange={e => change({ ...declaration,originCountryCode: e.target.value as PilotDeclaration['originCountryCode'] || null })}>
          <option value="">Nicht angegeben</option><option value="CH">Schweiz (CH)</option><option value="other">Anderes Land</option><option value="unknown">Unbekannt</option>
        </select>
      </label>
      <label className="block text-sm font-medium text-brand-800">Vollständige Reiseroute
        <select className={`${field} mt-1`} value={declaration.route ?? ''} onChange={e => change({ ...declaration,route: e.target.value as PilotDeclaration['route'] || null })}>
          <option value="">Nicht bestätigt</option><option value="complete_direct_ch_de">Vollständig: direkt CH → DE, ohne Transit oder weitere Länder</option><option value="other">Andere oder unvollständige Route</option><option value="unknown">Unbekannt</option>
        </select>
      </label>
      <p className="text-sm text-ink-900">Gespeicherter Reisezeitraum: <strong>{trip.startDate ?? 'Abreise fehlt'} – {trip.endDate ?? 'Rückreise fehlt'}</strong>. Änderungen am Zeitraum erfolgen über „Reise bearbeiten“.</p>
      <div className="flex flex-wrap gap-3">
        <button className="min-h-11 rounded-full bg-brand-800 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} type="submit">{busy && status!=='checking' ? 'Wird gespeichert …' : 'Angaben speichern'}</button>
        <button className="min-h-11 rounded-full border border-brand-800 px-5 py-2 text-sm font-semibold text-brand-800 disabled:opacity-50" disabled={busy || dirty || !current} type="button" onClick={onCheck}>{status==='checking' ? 'Wird geprüft …' : 'Offizielle Prüfung starten'}</button>
      </div>
    </form>
    <p role="status" aria-live="polite" className="mt-4 text-sm leading-6 text-ink-900">{message}</p>
    {error && <p role="alert" className="mt-3 text-sm text-danger-700">{error}</p>}
  </section>
}
