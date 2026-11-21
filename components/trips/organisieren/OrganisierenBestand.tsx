'use client'

import { useId, useState } from 'react'
import { ChevronRight } from 'lucide-react'

import { Preis } from '@/components/ui/preis'
import { StatusSiegel } from '@/components/ui/status-siegel'
import type { BestandEintrag } from '@/lib/trips/organisieren/bestand'
import type { Suchkategorie } from '@/lib/trips/workspace-mode'

const ZAHLWORT: Record<Suchkategorie, [string, string]> = {
  fluege: ['Flug', 'Flüge'],
  unterkunft: ['Unterkunft', 'Unterkünfte'],
  aktivitaeten: ['Aktivität', 'Aktivitäten'],
  mietwagen: ['Mietwagen', 'Mietwagen'],
  verbindungen: ['Verbindung', 'Verbindungen'],
}

const SICHTBAR = 3

function PreisText({ preis }: { preis: BestandEintrag['preis'] }) {
  if (preis.art === 'preis') return <Preis betrag={preis.betrag} waehrung={preis.waehrung} className="font-semibold" />
  return <span className="text-[color:var(--org-muted)]">{preis.art === 'ohne' ? 'ohne Preis' : 'Preis nicht lesbar'}</span>
}

/** «Das hast du schon»: was in dieser Kategorie bereits in der Reise steht, vor der Suche. */
export default function OrganisierenBestand({
  kategorie,
  eintraege,
  onItem,
}: {
  kategorie: Suchkategorie
  eintraege: readonly BestandEintrag[]
  onItem?: (itemId: string) => void
}) {
  const id = useId()
  const [alle, setAlle] = useState(false)
  if (eintraege.length === 0) return null
  const [einzahl, mehrzahl] = ZAHLWORT[kategorie]
  const sichtbar = alle ? eintraege : eintraege.slice(0, SICHTBAR)
  const rest = eintraege.length - SICHTBAR
  return (
    <section className="org-bestand" aria-labelledby={`${id}-titel`} data-organisieren-bestand={kategorie}>
      <div className="org-bestand-kopf">
        <h3 id={`${id}-titel`}>Das hast du schon</h3>
        <p>
          {eintraege.length} {eintraege.length === 1 ? einzahl : mehrzahl} in deiner Reise
        </p>
      </div>
      <ul>
        {sichtbar.map((eintrag) => {
          const inhalt = (
            <>
              <span className="org-bestand-text">
                <b>{eintrag.titel}</b>
                {eintrag.wann ? <small>{eintrag.wann}</small> : null}
              </span>
              <span className="org-bestand-stand">
                <StatusSiegel ton={eintrag.stand === 'gebucht' ? 'gebucht' : 'gewaehlt'}>
                  {eintrag.stand === 'gebucht' ? 'Gebucht' : 'Ausgewählt'}
                </StatusSiegel>
                <PreisText preis={eintrag.preis} />
              </span>
            </>
          )
          return (
            <li key={eintrag.id}>
              {onItem ? (
                <button type="button" className="org-bestand-zeile" onClick={() => onItem(eintrag.id)}>
                  {inhalt}
                  <span className="sr-only">Im Reiseplan öffnen</span>
                  <ChevronRight className="org-bestand-pfeil" aria-hidden="true" />
                </button>
              ) : (
                <div className="org-bestand-zeile">{inhalt}</div>
              )}
            </li>
          )
        })}
      </ul>
      {rest > 0 ? (
        <button type="button" className="org-bestand-mehr" aria-expanded={alle} onClick={() => setAlle((wert) => !wert)}>
          {alle ? 'Weniger anzeigen' : `Alle ${eintraege.length} anzeigen`}
        </button>
      ) : null}
    </section>
  )
}
