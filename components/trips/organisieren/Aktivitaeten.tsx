'use client'

import { cloneElement, isValidElement, useState, type ReactNode } from 'react'
import Reisefoto from './Reisefoto'
import { ArrowUpRight, Check } from 'lucide-react'
import { etappenZiel } from '@/lib/trips/organisieren/katalog'
import type { Trip } from '@/types/trips'
import { Feld } from './Suchfelder'

export default function Aktivitaeten({ reise, partner, startId }: { reise: Trip; partner?: ReactNode; startId?: string }) {
  const [id, setId] = useState(startId ?? reise.stages[0]?.id ?? '')
  const [thema, setThema] = useState('')
  const stage = reise.stages.find((s) => s.id === id)
  const ideen = (etappenZiel(stage)?.aktivitaeten ?? []).filter((a) => !thema || a.thema === thema)
  return (
    <>
      <div className="org-form">
        <div className="org-formtop">
          <h2>Aktivitäten entdecken</h2>
        </div>
        <div className="org-fields org-activityfields">
          <Feld label="Reiseetappe">
            <select value={id} onChange={(e) => setId(e.target.value)}>
              {reise.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Feld>
          <Feld label="Interesse">
            <select value={thema} onChange={(e) => setThema(e.target.value)}>
              <option value="">Alle Interessen</option>
              {['Kultur', 'Natur', 'Wasser'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Feld>
          <small>
            <Check size={15} /> Vorschläge werden direkt angezeigt
          </small>
        </div>
      </div>
      <section className="org-results">
        <h2>{stage ? 'Aktivitäten in ' + stage.name : 'Aktivitäten'}</h2>
        {ideen.length > 0 ? (
          <div className="org-actgrid">
            {ideen.map((a) => (
              <article key={a.name}>
                <Reisefoto src={a.bild} breite={420} hoehe={190} />
                <div>
                  <span className="org-pill">{a.thema}</span>
                  <h3>{a.name}</h3>
                  <p>{a.text}</p>
                  {a.tour && (
                    <a href={a.tour} target="_blank" rel="noopener noreferrer">
                      Tour bei GetYourGuide <ArrowUpRight size={14} />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>
            {stage
              ? 'Für diese Auswahl sind noch keine redaktionellen Ideen hinterlegt.'
              : 'Füge eine Etappe hinzu, um Aktivitäten zu entdecken.'}
          </p>
        )}
        {stage &&
          !thema &&
          isValidElement<{ organisierenEtappe?: string }>(partner) &&
          cloneElement(partner, { key: id, organisierenEtappe: id })}
      </section>
    </>
  )
}
