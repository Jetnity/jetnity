'use client'
import { useMemo, useState, useEffect, useId, useSyncExternalStore } from 'react'
import {
  ArrowDownUp,
  ArrowLeftRight,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  BusFront,
  CalendarDays,
  Clock3,
  Info,
  Map,
  Plane,
  Route,
  Search,
  Ship,
  TrainFront,
} from 'lucide-react'
import Ortswahl from './Ortswahl'
import Streckenkarte from './Streckenkarte'
import WeitereVerbindungen from './WeitereVerbindungen'
import { useStreckenwerte } from './Streckenwerte'
import {
  ausEtappe,
  datumText,
  dauer,
  geld,
  gleich,
  heute,
  namen,
  partnerlink,
  tag,
  type Abschnitt,
  type Register,
  type Modus,
  type Ort,
} from '@/lib/providers/omio/katalog'

const icons = { train: TrainFront, bus: BusFront, flight: Plane, ferry: Ship }
const schmal = () => window.matchMedia('(max-width:780px)').matches
function beobachteBreite(notify: () => void) {
  const q = window.matchMedia('(max-width:780px)')
  q.addEventListener('change', notify)
  return () => q.removeEventListener('change', notify)
}
const merkenKey = 'jetnity:verbindungen:v1:'
const none: Record<string, Modus> = {}
function leseMerkliste(id: string): Record<string, Modus> {
  try {
    const saved = JSON.parse(localStorage.getItem(merkenKey + id) ?? '{}')
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : none
  } catch {
    return none
  }
}
export default function OmioVergleich({
  katalog,
  abschnitte,
  startIndex = 0,
  kontext,
  reisende,
  waehrung,
}: {
  katalog: Register
  startIndex?: number
  abschnitte: (Abschnitt & { ausTagesplan?: boolean })[]
  kontext: string
  reisende: number
  waehrung: string
}) {
  const uid = useId(),
    mobil = useSyncExternalStore(beobachteBreite, schmal, () => false)
  const etappen = useMemo(
    () =>
      abschnitte.map((s) => ({
        ...s,
        von: ausEtappe(katalog.places, s.von),
        nach: ausEtappe(katalog.places, s.nach),
      })),
    [abschnitte, katalog],
  )
  const orte = useMemo(
    () => [
      ...new globalThis.Map(
        [...katalog.places, ...etappen.flatMap((s) => [s.von, s.nach])].map((o) => [o.id, o] as const),
      ).values(),
    ],
    [katalog, etappen],
  )
  const bevorzugt = useMemo(() => new Set(etappen.flatMap((s) => [s.von.id, s.nach.id])), [etappen])
  const start = etappen[startIndex]
  const anzahl = Math.max(1, Math.min(9, reisende))
  const [personen, setPersonen] = useState(anzahl),
    [vergleichPersonen, setVergleichPersonen] = useState(anzahl)
  const [von, setVon] = useState<Ort | null>(start?.von ?? null),
    [nach, setNach] = useState<Ort | null>(start?.nach ?? null)
  const [datum, setDatum] = useState(start?.datum ?? ''),
    [treffer, setTreffer] = useState<Abschnitt | null>(start ?? null)
  const [version, neu] = useState(0),
    [sort, setSort] = useState('auswahl'),
    [fehler, setFehler] = useState(''),
    [mobileKarte, setMobileKarte] = useState(false)
  const [merkliste, setMerkliste] = useState(() => leseMerkliste(kontext)),
    [meldung, setMeldung] = useState('')
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key === merkenKey + kontext) setMerkliste(leseMerkliste(kontext))
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [kontext])
  const werte = useStreckenwerte(treffer, katalog.date)
  const ergebnisse = [...werte.options]
  if (sort === 'preis') ergebnisse.sort((a, b) => (a.preis ?? Infinity) - (b.preis ?? Infinity))
  if (sort === 'dauer') ergebnisse.sort((a, b) => (a.minuten ?? Infinity) - (b.minuten ?? Infinity))
  const preise = ergebnisse.flatMap((e) => (e.preis === null ? [] : [e.preis]))
  const mindestpreis = preise.length > 1 ? Math.min(...preise) : null
  const routekey = treffer ? treffer.von.id + '/' + treffer.nach.id + '/' + treffer.datum : ''
  function merken(mode: Modus) {
    const zuletzt = leseMerkliste(kontext)
    const neu = { ...(zuletzt === none ? merkliste : zuletzt) }
    if (neu[routekey] === mode) {
      delete neu[routekey]
      setMeldung('Vormerkung entfernt.')
    } else {
      neu[routekey] = mode
      setMeldung(namen[mode] + ' für diese Etappe vorgemerkt.')
    }
    try {
      localStorage.setItem(merkenKey + kontext, JSON.stringify(neu))
    } catch {
      setMeldung('Die Vormerkung gilt für diese Sitzung.')
    }
    setMerkliste(neu)
  }
  function bearbeiten() {
    setFehler('')
    setMeldung('')
  }
  function auswahl(s: Abschnitt) {
    const d = s.datum
    setVergleichPersonen(personen)
    setVon(s.von)
    setNach(s.nach)
    setDatum(d)
    setTreffer({ ...s, datum: d })
    neu((i) => i + 1)
    setFehler('')
    setMeldung('Streckenvergleich aktualisiert.')
  }
  const link = treffer ? partnerlink(katalog.publisher, treffer.von, treffer.nach, treffer.datum) : null
  const offen =
    !!treffer &&
    (!von ||
      !nach ||
      von.id !== treffer.von.id ||
      nach.id !== treffer.nach.id ||
      datum !== treffer.datum ||
      personen !== vergleichPersonen)
  return (
    <section className="ov" aria-label="Verbindungen vergleichen">
      <form
        className="ov-search"
        onSubmit={(e) => {
          e.preventDefault()
          if (!von || !nach) {
            setFehler('Bitte wähle Start und Ziel aus den Ortsvorschlägen.')
            return
          }
          if (gleich(von, nach)) {
            setFehler('Start und Ziel müssen verschiedene Orte sein.')
            return
          }
          if (datum && (!tag(datum) || datum < heute())) {
            setFehler('Bitte wähle heute oder einen zukünftigen Reisetag.')
            return
          }
          auswahl({ von, nach, datum })
        }}
      >
        <div className="ov-formhead">
          <h2>
            <Route />
            Verbindung suchen
          </h2>
        </div>
        <div className="ov-fields">
          <Ortswahl
            key={'von' + version}
            titel="Von"
            orte={orte}
            wert={von}
            bevorzugt={bevorzugt}
            setzen={(o) => {
              bearbeiten()
              setVon(o)
            }}
          />
          <button
            type="button"
            className="ov-swap"
            aria-label="Start und Ziel tauschen"
            onClick={() => {
              setVon(nach)
              setNach(von)
              neu((i) => i + 1)
              bearbeiten()
            }}
          >
            <ArrowLeftRight size={17} />
          </button>
          <Ortswahl
            key={'nach' + version}
            titel="Nach"
            orte={orte}
            wert={nach}
            bevorzugt={bevorzugt}
            setzen={(o) => {
              bearbeiten()
              setNach(o)
            }}
          />
          <label className="ov-date">
            Reisedatum
            <span>
              <CalendarDays size={17} />
              <input
                type="date"
                value={datum}
                onChange={(e) => {
                  setDatum(e.target.value)
                  bearbeiten()
                }}
              />
            </span>
          </label>
          <label className="ov-people">
            Reisende
            <select
              aria-label="Anzahl Reisende"
              value={personen}
              onChange={(e) => {
                setPersonen(Number(e.target.value))
                bearbeiten()
              }}
            >
              {Array.from({ length: 9 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} {i === 0 ? 'Erwachsener' : 'Erwachsene'}
                </option>
              ))}
            </select>
          </label>
          <button className="ov-primary" type="submit">
            <Search size={18} />
            Vergleichen
          </button>
        </div>
        {datum && etappen.some(s => s.ausTagesplan && s.datum === datum && s.von.id === von?.id && s.nach.id === nach?.id) &&
          <p className="ov-hint">Datum aus deinem Tagesplan vorgeschlagen.</p>}
        {etappen.length > 0 && (
          <div className="ov-legs" aria-label="Reiseetappen">
            <span>Reiseetappen</span>
            {etappen.map((s, i) => (
              <button
                key={i}
                aria-pressed={
                  !!treffer && treffer.von.id === s.von.id && treffer.nach.id === s.nach.id && !offen
                }
                type="button"
                onClick={() => auswahl(s)}
              >
                {s.von.name} → {s.nach.name}
              </button>
            ))}
          </div>
        )}
        {fehler && (
          <p className="ov-warning" role="alert">
            {fehler}
          </p>
        )}
      </form>
      {treffer && (
        <div className="ov-results">
          <div className="ov-resultshead">
            <div>
              <p className="ov-date-line">
                <CalendarDays size={14} />
                {datumText(treffer.datum)}
              </p>
              <h2>
                {treffer.von.name}
                <span aria-label="nach"> → </span>
                {treffer.nach.name}
              </h2>
            </div>
            <label className="ov-sort">
              <ArrowDownUp size={15} />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Verkehrsmittel sortieren"
                disabled={!ergebnisse.length}
              >
                <option value="auswahl">Übersicht</option>
                <option value="preis">Niedrigster Preis</option>
                <option value="dauer">Kürzeste Dauer</option>
              </select>
            </label>
          </div>
          {offen && (
            <p className="ov-warning" role="status">
              Suchfelder geändert. Mit „Vergleichen“ aktualisierst du die Ergebnisse.
            </p>
          )}
          <button
            type="button"
            className="ov-mobilemap"
            aria-expanded={mobileKarte}
            aria-controls={uid + '-map'}
            onClick={() => setMobileKarte(!mobileKarte)}
          >
            <Map size={16} />
            {mobileKarte ? 'Karte ausblenden' : 'Karte anzeigen'}
          </button>
          <div className={'ov-layout' + (mobileKarte ? ' ov-showmap' : '')}>
            <div className="ov-list">
              {werte.laedt && (
                <p className="ov-hint" role="status">
                  Vergleichswerte werden geladen …
                </p>
              )}
              {werte.fehler && (
                <p className="ov-warning" role="alert">
                  Die Omio-Werte sind gerade nicht erreichbar.{' '}
                  <button type="button" className="underline" onClick={werte.wiederholen}>
                    Erneut versuchen
                  </button>
                </p>
              )}
              {ergebnisse.map((row) => {
                const Symbol = icons[row.mode],
                  url = partnerlink(katalog.publisher, treffer.von, treffer.nach, treffer.datum, row.mode),
                  gemerkt = merkliste[routekey] === row.mode
                return (
                  <article className="ov-card" key={row.mode}>
                    <div className="ov-cardtop">
                      <div className="ov-mode">
                        <span className="ov-icon">
                          <Symbol />
                        </span>
                        <h3>{namen[row.mode]}</h3>
                        {row.preis !== null && row.preis === mindestpreis && (
                          <span className="ov-cheap">Niedrigster Katalogpreis</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="ov-save"
                        disabled={offen}
                        aria-label={
                          namen[row.mode] +
                          (gemerkt ? ' aus Vormerkung entfernen' : ' für diese Etappe vormerken')
                        }
                        aria-pressed={gemerkt}
                        title={gemerkt ? 'Vorgemerkt' : 'Auf diesem Gerät vormerken'}
                        onClick={() => merken(row.mode)}
                      >
                        {gemerkt ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                      </button>
                    </div>
                    <div className="ov-facts">
                      <div>
                        <small>Katalogpreis ab</small>
                        <b>{row.preis === null ? 'Preis offen' : geld(row.preis)}</b>
                      </div>
                      <div>
                        <small>{row.mode === 'flight' ? 'Kürzeste Flugzeit' : 'Kürzeste Fahrzeit'}</small>
                        <strong>
                          <Clock3 size={15} />
                          {row.minuten === null ? 'Dauer offen' : dauer(row.minuten)}
                        </strong>
                      </div>
                      {url && !offen && (
                        <a
                          className="ov-offerlink"
                          href={url}
                          rel="sponsored noopener noreferrer"
                          target="_blank"
                        >
                          Bei Omio prüfen
                          <ArrowUpRight size={15} />
                        </a>
                      )}
                    </div>
                  </article>
                )
              })}
              {!werte.laedt && !werte.fehler && !ergebnisse.length && (
                <article className="ov-empty">
                  <span className="ov-icon">
                    <Route />
                  </span>
                  <h3>Strecke bei Omio prüfen</h3>
                  <p>
                    Für diese Richtung enthält der Schweizer Katalog keine Vergleichswerte. Omio prüft die
                    verfügbaren Verbindungen für deinen Reisetag.
                  </p>
                  {link && !offen && (
                    <a
                      className="ov-offerlink"
                      href={link}
                      rel="sponsored noopener noreferrer"
                      target="_blank"
                    >
                      Suche bei Omio öffnen
                      <ArrowUpRight size={15} />
                    </a>
                  )}
                </article>
              )}
              {!link && (
                <p className="ov-warning">
                  Wähle einen Reisetag und bestätige mit „Vergleichen“, um die Abfahrten bei Omio zu prüfen.
                </p>
              )}
              <p className="ov-disclosure">
                <Info size={15} />
                <span>
                  Omio-Katalog · {datumText(werte.stand)}. Preis und kürzeste Dauer sind getrennte
                  Streckenwerte. Abfahrtszeiten, Verfügbarkeit und Preis für deine Reisegruppe zeigt Omio. Bei
                  einer vermittelten Buchung kann Jetnity eine Provision erhalten.
                </span>
              </p>
              {!offen && (
                <WeitereVerbindungen
                  key={routekey + '/' + vergleichPersonen}
                  abschnitt={treffer}
                  personen={vergleichPersonen}
                  waehrung={waehrung}
                />
              )}
            </div>
            <div id={uid + '-map'} className="ov-mapcol">
              {(!mobil || mobileKarte) && (
                <Streckenkarte
                  key={treffer.von.id + '/' + treffer.nach.id}
                  von={treffer.von}
                  nach={treffer.nach}
                />
              )}
            </div>
          </div>
        </div>
      )}
      {!treffer && <p className="ov-hint">Wähle Start und Ziel, um Verbindungen zu vergleichen.</p>}
      <span className="ov-sr" role="status">
        {meldung}
      </span>
    </section>
  )
}
