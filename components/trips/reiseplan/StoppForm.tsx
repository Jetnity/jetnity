'use client'

import { useRef, useState } from 'react'
import { MapPin, X } from 'lucide-react'
import type { Trip, TripSource } from '@/types/trips'
import { GRENZEN } from '@/lib/trips/schema'
import { AENDERUNG_GRENZEN } from '@/lib/reiseaenderung/schema'
import { etappenZeitraumAnzeigen } from '@/lib/trips/datum-anzeige'
import { gastManuellSpeichern } from '@/lib/reiseaenderung/direct/gast'
import { manuellVorschau, type ManuelleVorschau } from '@/lib/reiseaenderung/direct/speichern'
import { manuelleAenderungVorschau, manuelleAenderungUebernehmen } from '@/lib/reiseaenderung/aktionen'

export default function StoppForm({ trip, quelle, nach, position, onKarte, onClose, onSaved }: {
  trip: Trip
  quelle: TripSource
  nach: string | null
  position: { lat: number; lng: number } | null
  onKarte: () => void
  onClose: () => void
  onSaved: (trip: Trip) => void
}) {
  const [basis] = useState(trip)
  const [name, setName] = useState('')
  const [tage, setTage] = useState('1')
  const [after, setAfter] = useState(nach ?? '')
  const [preview, setPreview] = useState<ManuelleVorschau | null>(null)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const [status, setStatus] = useState('')
  const [ungewiss, setUngewiss] = useState(false)
  const stale = basis.revision !== trip.revision
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (lock.current || stale) return
    lock.current = true
    setBusy(true)
    setStatus('')
    try {
      if (!preview) {
        const eingabe = { neuerStopp: { name: name.trim(), tage: Number(tage), nachEtappeId: after || null, position } }
        const seed = crypto.randomUUID()
        const result = quelle === 'guest' ? await manuellVorschau(basis, eingabe, seed) :
          await manuelleAenderungVorschau({ tripId: basis.id, basisRevision: basis.revision, eingabe, seed })
        if (result.ok) setPreview(result.vorschau)
        else setStatus(result.meldung)
      } else {
        const request = { ...preview.anfrage, nurPruefen: ungewiss }
        const result = quelle === 'guest' ? await gastManuellSpeichern(request) : await manuelleAenderungUebernehmen(request)
        if (result.ok) { onSaved(result.reise); return }
        setStatus(result.meldung)
        setUngewiss(result.art === 'ungewiss')
      }
    } catch {
      setUngewiss(!!preview)
      setStatus(preview ? 'Die Speicherung ist noch nicht bestätigt. Bitte prüfe denselben Stopp erneut.' : 'Die Vorschau ist gerade nicht erreichbar.')
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return <form className="et-stop-form" onSubmit={submit}>
    <div className="et-row"><h3>Stopp hinzufügen</h3><button type="button" className="et-icon" aria-label="Schliessen" disabled={busy || ungewiss} onClick={onClose}><X size={18}/></button></div>
    {preview ? <><h4>{name.trim()}</h4><p>{tage} {tage === '1' ? 'zusätzlicher Tag' : 'zusätzliche Tage'} · {preview.nachher.days.length} Reisetage insgesamt</p>
      <p>{etappenZeitraumAnzeigen(preview.nachher.startDate, preview.nachher.endDate) || 'Datum offen'}</p>
      {!ungewiss && <button type="button" className="et-secondary" disabled={busy} onClick={() => setPreview(null)}>Angaben ändern</button>}</> :
      <fieldset disabled={busy || stale}><label>Ortsname<input required maxLength={GRENZEN.ort} value={name} placeholder="z. B. Ayutthaya" onChange={e => setName(e.target.value)} /></label>
        <div className="et-inputs"><label>Einfügen nach<select value={after} onChange={e => setAfter(e.target.value)}><option value="">Am Ende der Route</option>
          {[...basis.stages].sort((a,b) => a.position-b.position).map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
          <label>Aufenthalt in Tagen<input type="number" min={1} max={AENDERUNG_GRENZEN.neueEtappenTage} required value={tage} onChange={e => setTage(e.target.value)}/></label></div>
        <button type="button" className="et-secondary" onClick={onKarte}><MapPin size={16}/>{position ? 'Kartenposition ändern' : 'Position auf Karte setzen'}</button>
        {position && <small>{position.lat.toFixed(4)}°, {position.lng.toFixed(4)}°</small>}
      </fieldset>}
    {(status || stale) && <p role="alert">{stale ? 'Deine Reise hat sich geändert. Öffne die Erfassung mit dem aktuellen Reiseplan erneut.' : status}</p>}
    <button type="submit" className="et-primary" disabled={busy || stale}>{busy ? 'Wird geprüft …' : ungewiss ? 'Speicherung prüfen' : preview ? 'Stopp speichern' : 'Änderung ansehen'}</button>
  </form>
}
