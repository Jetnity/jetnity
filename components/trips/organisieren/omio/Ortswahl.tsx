'use client'
import { useId, useMemo, useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { land, normal, type Ort } from './katalog'

export default function Ortswahl({
  titel,
  orte,
  wert,
  setzen,
  bevorzugt,
}: {
  titel: string
  orte: Ort[]
  wert: Ort | null
  setzen: (o: Ort | null) => void
  bevorzugt: Set<string>
}) {
  const id = useId()
  const [eingabe, setEingabe] = useState(''),
    [offen, setOffen] = useState(false),
    [aktiv, setAktiv] = useState(-1)
  const query = normal(eingabe)
  const liste = useMemo(
    () =>
      orte
        .map((o) => ({ o, n: normal(o.name) }))
        .filter(({ n }) => !query || n.includes(query))
        .sort((a, b) => {
          const score = (n: string, o: Ort) =>
            (n === query ? 100 : 0) + (n.startsWith(query) ? 10 : 0) + (bevorzugt.has(o.id) ? 4 : 0)
          return (
            score(b.n, b.o) - score(a.n, a.o) ||
            (b.o.weight ?? 0) - (a.o.weight ?? 0) ||
            a.n.localeCompare(b.n, 'de')
          )
        })
        .slice(0, 8)
        .map((x) => x.o),
    [orte, query, bevorzugt],
  )
  const freierOrt: Ort = { id: 'frei:' + query, name: eingabe.trim(), country: '', lat: null, lng: null }
  const vorschlaege =
    query.length >= 2 && !liste.some((o) => normal(o.name) === query) ? [...liste, freierOrt] : liste
  function auswahl(o: Ort) {
    setzen(o)
    setEingabe('')
    setOffen(false)
    setAktiv(-1)
  }
  function ende() {
    setOffen(false)
    setAktiv(-1)
  }
  useEffect(() => {
    if (offen && aktiv >= 0) document.getElementById(id + '-' + aktiv)?.scrollIntoView({ block: 'nearest' })
  }, [offen, aktiv, id])
  const exakt = query ? orte.filter((o) => normal(o.name) === query) : []

  return (
    <div
      className="ov-place"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          if (!wert && exakt.length === 1) auswahl(exakt[0]!)
          else ende()
        }
      }}
    >
      <label htmlFor={id}>{titel}</label>
      <div className="ov-input">
        <MapPin size={17} />
        <input
          id={id}
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={offen}
          aria-controls={offen ? id + '-list' : undefined}
          aria-activedescendant={offen && aktiv >= 0 ? id + '-' + aktiv : undefined}
          placeholder="Ort oder Station"
          maxLength={100}
          value={wert?.name ?? eingabe}
          onFocus={(e) => {
            e.target.select()
            setOffen(true)
          }}
          onClick={() => setOffen(true)}
          onChange={(e) => {
            setEingabe(e.target.value)
            setzen(null)
            setOffen(true)
            setAktiv(-1)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              ende()
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
              setOffen(true)
              setAktiv((i) =>
                Math.max(0, Math.min(vorschlaege.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1))),
              )
            }
            if (e.key === 'Enter' && offen) {
              e.preventDefault()
              const kandidat =
                vorschlaege[aktiv] ??
                (exakt.length === 1 ? exakt[0] : undefined) ??
                (query && vorschlaege.length === 1 ? vorschlaege[0] : undefined)
              if (kandidat) auswahl(kandidat)
              else if (wert) ende()
            }
          }}
        />
      </div>
      {offen && (
        <div className="ov-menu">
          <ul role="listbox" id={id + '-list'} aria-label={titel}>
            {vorschlaege.map((o, i) => (
              <li
                key={o.id}
                role="option"
                id={id + '-' + i}
                aria-selected={i === aktiv}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => auswahl(o)}
              >
                <span>{o.name}</span>
                <small>{o.id.startsWith('frei:') ? 'Freie Ortseingabe' : land(o)}</small>
              </li>
            ))}
          </ul>
          {!vorschlaege.length && <p>Kein passender Ort im Katalog.</p>}
        </div>
      )}
    </div>
  )
}
