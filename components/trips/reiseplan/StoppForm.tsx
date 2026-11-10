'use client'

import { useId, useRef, useState } from 'react'
import { MapPin, X } from 'lucide-react'
import type { Trip, TripSource } from '@/types/trips'
import { GRENZEN } from '@/lib/trips/schema'
import OrtSuche from '@/components/places/OrtSuche'
import type { OrtAuswahl } from '@/lib/places/auswahl'
import StoppVorschau from './StoppVorschau'
import { AENDERUNG_GRENZEN } from '@/lib/reiseaenderung/schema'
import { gastManuellSpeichern } from '@/lib/reiseaenderung/direct/gast'
import { manuellVorschau, type ManuelleVorschau } from '@/lib/reiseaenderung/direct/speichern'
import { manuelleAenderungVorschau, manuelleAenderungUebernehmen } from '@/lib/reiseaenderung/aktionen'

export default function StoppForm({
  trip,
  quelle,
  nach,
  position,
  onKarte,
  onPosition,
  onClose,
  onSaved,
}: {
  trip: Trip
  quelle: TripSource
  nach: string | null
  position: { lat: number; lng: number } | null
  onKarte: () => void
  onPosition: (point: { lat: number; lng: number } | null) => void
  onClose: () => void
  onSaved: (trip: Trip) => void
}) {
  const [basis] = useState(trip)
  const [name, setName] = useState('')
  const [ort, setOrt] = useState<OrtAuswahl | null>(null)
  const ortFeld = useId()
  const [tage, setTage] = useState('1')
  const [after, setAfter] = useState(nach ?? '')
  const [preview, setPreview] = useState<ManuelleVorschau | null>(null)
  const [coordsText, setCoordsText] = useState<{ lat: string; lng: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const [status, setStatus] = useState('')
  const [ungewiss, setUngewiss] = useState(false)
  const stale = basis.revision !== trip.revision
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (lock.current || stale) return
    const coord = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')))
    const pin =
      coordsText && (coordsText.lat.trim() || coordsText.lng.trim())
        ? { lat: coord(coordsText.lat), lng: coord(coordsText.lng) }
        : position
    if (
      pin &&
      (!Number.isFinite(pin.lat) ||
        Math.abs(pin.lat) > 90 ||
        !Number.isFinite(pin.lng) ||
        Math.abs(pin.lng) > 180)
    ) {
      setStatus('Gib einen Breitengrad von −90 bis 90 und einen Längengrad von −180 bis 180 ein.')
      return
    }
    lock.current = true
    setBusy(true)
    setStatus('')
    try {
      if (!preview) {
        const rahmen = { tage: Number(tage), nachEtappeId: after || null }
        const eingabe = {
          neuerStopp: ort ? { ...rahmen, ortId: ort.id } : { ...rahmen, name: name.trim(), position: pin },
        }
        if (!ort && (!name.trim() || name.trim().length > GRENZEN.ort)) {
          setStatus('Gib einen Ortsnamen mit höchstens ' + GRENZEN.ort + ' Zeichen ein.')
          return
        }
        const seed = crypto.randomUUID()
        const result =
          quelle === 'guest'
            ? await manuellVorschau(basis, eingabe, seed)
            : await manuelleAenderungVorschau({
                tripId: basis.id,
                basisRevision: basis.revision,
                eingabe,
                seed,
              })
        if (result.ok) setPreview(result.vorschau)
        else setStatus(result.meldung)
      } else {
        const request = { ...preview.anfrage, nurPruefen: ungewiss }
        const result =
          quelle === 'guest'
            ? await gastManuellSpeichern(request)
            : await manuelleAenderungUebernehmen(request)
        if (result.ok) {
          onSaved(result.reise)
          return
        }
        setStatus(result.meldung)
        setUngewiss(result.art === 'ungewiss')
      }
    } catch {
      setUngewiss(!!preview)
      setStatus(
        preview
          ? 'Die Speicherung ist noch nicht bestätigt. Bitte prüfe denselben Stopp erneut.'
          : 'Die Vorschau ist gerade nicht erreichbar.',
      )
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return (
    <form className="et-stop-form" onSubmit={submit}>
      <div className="et-row">
        <h3>Stopp hinzufügen</h3>
        <button
          type="button"
          className="et-icon"
          aria-label="Schliessen"
          disabled={busy || ungewiss}
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      {preview ? (
        <>
          <StoppVorschau vorschau={preview} />
          {!ungewiss && (
            <button type="button" className="et-secondary" disabled={busy} onClick={() => setPreview(null)}>
              Angaben ändern
            </button>
          )}
        </>
      ) : (
        <fieldset disabled={busy || stale}>
          <div>
            <label htmlFor={ortFeld}>Ortsname</label>
            <OrtSuche
              inputId={ortFeld}
              rolle="ziel"
              variante="field"
              value={ort}
              initialText={name}
              placeholder="Stadt, Insel oder eigener Stopp"
              disabled={busy || stale}
              onChange={(wahl, text) => {
                setName(text)
                setOrt(wahl)
                setStatus('')
                if (wahl || ort) {
                  setCoordsText(null)
                  onPosition(null)
                }
              }}
            />
          </div>
          <div className="et-inputs">
            <label>
              Einfügen nach
              <select value={after} onChange={(e) => setAfter(e.target.value)}>
                <option value="">Am Ende der Route</option>
                {[...basis.stages]
                  .sort((a, b) => a.position - b.position)
                  .map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Aufenthalt in Tagen
              <input
                type="number"
                min={1}
                max={AENDERUNG_GRENZEN.neueEtappenTage}
                required
                value={tage}
                onChange={(e) => setTage(e.target.value)}
              />
            </label>
          </div>
          {ort ? (
            <small className="flex items-center gap-1">
              <MapPin size={15} /> Standort aus dem Ortskatalog
            </small>
          ) : (
            <>
              <button
                type="button"
                className="et-secondary"
                onClick={() => {
                  setCoordsText(null)
                  onKarte()
                }}
              >
                <MapPin size={16} />
                {position ? 'Kartenposition ändern' : 'Position auf Karte setzen'}
              </button>
              <details className="et-coord-fields">
                <summary>Koordinaten eingeben</summary>
                <div className="et-inputs">
                  <label>
                    Breitengrad
                    <input
                      inputMode="decimal"
                      placeholder="z. B. 14,35"
                      value={coordsText?.lat ?? position?.lat ?? ''}
                      onChange={(e) => {
                        setCoordsText({
                          lat: e.target.value,
                          lng: coordsText?.lng ?? String(position?.lng ?? ''),
                        })
                        onPosition(null)
                      }}
                    />
                  </label>
                  <label>
                    Längengrad
                    <input
                      inputMode="decimal"
                      placeholder="z. B. 100,57"
                      value={coordsText?.lng ?? position?.lng ?? ''}
                      onChange={(e) => {
                        setCoordsText({
                          lng: e.target.value,
                          lat: coordsText?.lat ?? String(position?.lat ?? ''),
                        })
                        onPosition(null)
                      }}
                    />
                  </label>
                </div>
              </details>
              {position && (
                <small>
                  {position.lat.toFixed(4)}°, {position.lng.toFixed(4)}°
                </small>
              )}
            </>
          )}
        </fieldset>
      )}
      {(status || stale) && (
        <p role="alert">
          {stale
            ? 'Deine Reise hat sich geändert. Öffne die Erfassung mit dem aktuellen Reiseplan erneut.'
            : status}
        </p>
      )}
      <button type="submit" className="et-primary" disabled={busy || stale}>
        {busy
          ? 'Wird geprüft …'
          : ungewiss
            ? 'Speicherung prüfen'
            : preview
              ? 'Stopp speichern'
              : 'Änderung ansehen'}
      </button>
    </form>
  )
}
