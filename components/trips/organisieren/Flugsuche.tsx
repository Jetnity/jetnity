'use client'

import { useId, useState, type FormEvent, type ReactNode } from 'react'
import FlughafenSuche from '@/components/airports/FlughafenSuche'
import FlugKarte from '@/components/trips/FlugKarte'
import type { FlughafenAuswahl } from '@/lib/airports/auswahl'
import type { FlugSucheAntwort, FlugOptionSichtbar } from '@/lib/flights/client-sicht'
import type { FlugKabine } from '@/lib/flights/domain'
import type { FlughafenReferenzKarte } from '@/lib/route/domain'
import { heutigesDatum } from '@/lib/account/naechste-reise'
import { vorgeschlagenerFlughafen } from '@/lib/trips/organisieren/katalog'
import type { Trip } from '@/types/trips'
import { Feld, Personen, SucheKnopf, useSuchanfrage } from './Suchfelder'

export type FlugSpeichern = (
  tag: string | null,
  option: FlugOptionSichtbar,
  refs?: FlughafenReferenzKarte,
) => Promise<string | null>

function FlughafenFeld({
  label,
  wert,
  setzen,
}: {
  label: string
  wert: FlughafenAuswahl | null
  setzen: (v: FlughafenAuswahl | null) => void
}) {
  const id = useId()
  return (
    <div className="org-field">
      <label htmlFor={id}>{label}</label>
      <FlughafenSuche
        inputId={id}
        value={wert}
        onChange={setzen}
        placeholder="Stadt oder Flughafen"
        inputClassName="org-air-input"
      />
    </div>
  )
}

export default function Flugsuche({
  reise,
  etappen,
  speichern,
}: {
  reise: Trip
  etappen: ReactNode
  speichern?: FlugSpeichern
}) {
  const erste = reise.stages[0],
    letzte = reise.stages.at(-1)
  const [von, setVon] = useState(() => vorgeschlagenerFlughafen(reise.originPlaceId, reise.origin))
  const [nach, setNach] = useState(() =>
    vorgeschlagenerFlughafen(erste?.placeId ?? null, erste?.name ?? null, erste),
  )
  const [zurueck, setZurueck] = useState(() =>
    vorgeschlagenerFlughafen(letzte?.placeId ?? null, letzte?.name ?? null, letzte),
  )
  const [art, setArt] = useState(
    !reise.endDate
      ? 'einfach'
      : erste && letzte && (erste.placeId ?? erste.name) !== (letzte.placeId ?? letzte.name)
        ? 'gabel'
        : 'retour',
  )
  const [hin, setHin] = useState(reise.startDate ?? ''),
    [rueck, setRueck] = useState(reise.endDate ?? '')
  const [gaeste, setGaeste] = useState(Math.max(1, Math.min(9, reise.travellers)))
  const [kabine, setKabine] = useState<FlugKabine>('economy'),
    [direkt, setDirekt] = useState(false)
  const [speichert, setSpeichert] = useState(false),
    [hinweis, setHinweis] = useState('')
  const [sort, setSort] = useState('auswahl')
  const suche = useSuchanfrage<FlugSucheAntwort>()
  const reset = () => {
    suche.reset()
    setHinweis('')
  }
  async function absenden(event: FormEvent) {
    event.preventDefault()
    reset()
    const retour = art === 'gabel' ? zurueck : nach
    if (!von || !nach || (art !== 'einfach' && !retour))
      return suche.setFehler('Bitte wähle alle Flughäfen aus den Vorschlägen.')
    if (von.iata === nach.iata || (art !== 'einfach' && retour?.iata === von.iata))
      return suche.setFehler('Abflug und Ankunft müssen je Strecke verschieden sein.')
    if (hin < heutigesDatum() || (art !== 'einfach' && rueck < hin))
      return suche.setFehler('Bitte prüfe die Flugtermine.')
    const legs = [{ origin: von.iata, destination: nach.iata, date: hin }]
    if (art !== 'einfach' && retour) legs.push({ origin: retour.iata, destination: von.iata, date: rueck })
    await suche.suchen(async (signal) => {
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal,
        body: JSON.stringify({
          legs,
          passengers: { adults: gaeste, children: 0, infants: 0 },
          cabin: kabine,
          stopPreference: direkt ? 'nonstop' : 'any',
          currency: reise.currency,
          context: { tripStartDate: reise.startDate, tripEndDate: reise.endDate, selectedDate: hin },
        }),
      })
      const data: FlugSucheAntwort = await response.json()
      if (!response.ok || !Array.isArray(data.options))
        throw new Error(data.message || 'Flugangebote sind gerade nicht verfügbar.')
      return data
    })
  }
  const optionen = [...(suche.daten?.options ?? [])]
  if (sort === 'preis' && optionen.every((o) => o.priceCurrency === optionen[0]?.priceCurrency))
    optionen.sort((a, b) => a.priceAmount - b.priceAmount)
  if (sort === 'dauer') optionen.sort((a, b) => a.durationMinutes - b.durationMinutes)
  return (
    <>
      <form className="org-form" onSubmit={absenden} onChange={reset}>
        <div className="org-formtop">
          <h2>Flug suchen</h2>
          <select aria-label="Reiseart" value={art} onChange={(e) => setArt(e.target.value)}>
            <option value="gabel">Gabelflug</option>
            <option value="retour">Hin- und Rückflug</option>
            <option value="einfach">Nur Hinflug</option>
          </select>
        </div>
        <div className={'org-fields ' + (art === 'einfach' ? 'org-four' : '')}>
          <FlughafenFeld
            label="Von"
            wert={von}
            setzen={(v) => {
              reset()
              setVon(v)
            }}
          />
          <FlughafenFeld
            label="Nach"
            wert={nach}
            setzen={(v) => {
              reset()
              setNach(v)
            }}
          />
          <Feld label="Hinflug">
            <input required type="date" value={hin} onChange={(e) => setHin(e.target.value)} />
          </Feld>
          {art !== 'einfach' && (
            <Feld label="Rückflug">
              <input
                required
                type="date"
                min={hin}
                value={rueck}
                onChange={(e) => setRueck(e.target.value)}
              />
            </Feld>
          )}
          <Personen wert={gaeste} setzen={setGaeste} />
          <SucheKnopf busy={suche.busy} />
        </div>
        <div className="org-sub">
          {art === 'gabel' && (
            <FlughafenFeld
              label="Rückflug ab"
              wert={zurueck}
              setzen={(v) => {
                reset()
                setZurueck(v)
              }}
            />
          )}
          <label>
            Reiseklasse{' '}
            <select value={kabine} onChange={(e) => setKabine(e.target.value as FlugKabine)}>
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </label>
          <label>
            <input type="checkbox" checked={direkt} onChange={(e) => setDirekt(e.target.checked)} /> Nur
            Direktflüge
          </label>
        </div>
        {suche.fehler && <p role="alert">{suche.fehler}</p>}
      </form>
      {suche.daten ? (
        <section className="org-results">
          <div className="org-sectionhead">
            <h2>Flüge nach {nach?.name}</h2>
            {optionen.length > 1 && (
              <select aria-label="Flüge sortieren" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="auswahl">Auswahl</option>
                {optionen.every((o) => o.priceCurrency === optionen[0]?.priceCurrency) && (
                  <option value="preis">Günstigste zuerst</option>
                )}
                <option value="dauer">Kürzeste Dauer</option>
              </select>
            )}
          </div>
          <p role="status">{suche.daten.message}</p>
          {optionen.map((o) => (
            <FlugKarte
              key={o.id}
              option={o}
              refs={suche.daten?.airportRefs}
              laeuft={speichert}
              onUebernehmen={
                speichern
                  ? async () => {
                      if (speichert) return
                      setSpeichert(true)
                      try {
                        setHinweis(
                          (await speichern(
                            reise.days.find((tag) => tag.dayDate === hin)?.id ?? null,
                            o,
                            suche.daten?.airportRefs,
                          )) ?? 'Flug in die Reise übernommen.',
                        )
                      } catch {
                        setHinweis('Der Flug konnte nicht gespeichert werden.')
                      } finally {
                        setSpeichert(false)
                      }
                    }
                  : undefined
              }
            />
          ))}
          {hinweis && <p role="status">{hinweis}</p>}
        </section>
      ) : (
        etappen
      )}
    </>
  )
}
