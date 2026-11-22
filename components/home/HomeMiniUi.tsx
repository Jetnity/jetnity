import { Fragment, type CSSProperties } from 'react'
import { Bed, Check, Clock3, Plane, Ship, TriangleAlert } from 'lucide-react'

/**
 * Kleine Bildflächen für die Karten der Startseite. Sie sind reine Illustration:
 * ohne Zahlen, ohne Länder, ohne Preise und ohne Zusage zu einem Prüfergebnis.
 * Jede Fläche ist für Hilfstechnik verborgen, die Aussage steht im Kartentext.
 */

const punkt = (farbe: string) => ({ '--hs-punkt': farbe }) as CSSProperties

const STATIONEN = [
  { name: 'Flug', symbol: Plane },
  { name: 'Fähre', symbol: Ship },
  { name: 'Nacht', symbol: Bed },
] as const

export function MiniRoute() {
  return (
    <div className="hs-flaeche hs-flaeche-karte" aria-hidden="true">
      <div className="hs-zeile hs-zeile-route">
        {STATIONEN.map((station, index) => (
          <Fragment key={station.name}>
            {index > 0 ? (
              <span className={`hs-strecke ${index === 1 ? 'hs-strecke-luecke' : ''}`}>
                <span className={`hs-marke ${index === 1 ? 'hs-marke-achtung' : ''}`}>
                  {index === 1 ? <TriangleAlert className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                </span>
              </span>
            ) : null}
            <span className="hs-station">
              <span className="hs-knoten"><station.symbol className="h-4 w-4" /></span>
              <span className="hs-etikett">{station.name}</span>
            </span>
          </Fragment>
        ))}
      </div>
      <ul className="hs-legende">
        <li style={punkt('rgb(var(--jet-status-achtung))')}>Lücke</li>
        <li style={punkt('rgb(var(--jet-status-ok))')}>Lösung</li>
      </ul>
    </div>
  )
}

export function MiniPass() {
  return (
    <div className="hs-flaeche" aria-hidden="true">
      <div className="hs-pass">
        <span className="hs-pass-foto" />
        <span className="hs-pass-zeilen"><i /><i /><i /></span>
        <span className="hs-pass-abzeichen">
          <Check />
          Offizielle Quelle
        </span>
      </div>
      <div className="hs-pass">
        <span className="hs-pass-foto" />
        <span className="hs-pass-zeilen"><i /><i /><i /></span>
        <span className="hs-pass-abzeichen">
          <Clock3 />
          Frist
        </span>
      </div>
    </div>
  )
}

const KOSTEN_ZEILEN = [
  { name: 'Option A', beste: false, teile: [38, 14, 18, 30] },
  { name: 'Option B', beste: true, teile: [34, 18, 12, 36] },
] as const

const KOSTEN_LEGENDE = [
  { text: 'Flug', farbe: 'rgb(var(--jet-brand-600))' },
  { text: 'Gepäck', farbe: 'rgb(var(--jet-citrus-500))' },
  { text: 'Transfer', farbe: 'rgb(var(--jet-brand-600) / 0.45)' },
  { text: 'Übernachtung', farbe: 'rgb(var(--jet-citrus-400))' },
] as const

export function MiniKosten() {
  return (
    <div className="hs-flaeche" aria-hidden="true">
      {KOSTEN_ZEILEN.map((zeile) => (
        <div key={zeile.name} className={`hs-balken-zeile ${zeile.beste ? 'hs-balken-beste' : ''}`}>
          <span className="hs-balken">
            {zeile.teile.map((teil, index) => (
              <i key={index} style={{ width: `${teil}%` }} />
            ))}
          </span>
          <span className="text-xs font-semibold">{zeile.name}</span>
        </div>
      ))}
      <ul className="hs-legende">
        {KOSTEN_LEGENDE.map((eintrag) => (
          <li key={eintrag.text} style={punkt(eintrag.farbe)}>{eintrag.text}</li>
        ))}
      </ul>
    </div>
  )
}
