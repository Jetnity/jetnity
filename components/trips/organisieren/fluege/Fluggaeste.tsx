'use client'

import { useRef } from 'react'
import { ChevronDown, Minus, Plus } from 'lucide-react'

export interface FluggaesteWert {
  erwachsene: number
  kinder: number
  babys: number
}

export default function Fluggaeste({
  wert,
  setzen,
}: {
  wert: FluggaesteWert
  setzen: (v: FluggaesteWert) => void
}) {
  const ref = useRef<HTMLDetailsElement>(null)
  const summe = wert.erwachsene + wert.kinder + wert.babys
  return (
    <details
      ref={ref}
      className="flug-guests org-field"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && ref.current) {
          ref.current.open = false
          ref.current.querySelector('summary')?.focus()
        }
      }}
    >
      <summary>
        <span>Reisende</span>
        <strong>
          {summe} {summe === 1 ? 'Person' : 'Personen'}
        </strong>
        <ChevronDown size={16} aria-hidden="true" />
      </summary>
      <div className="flug-guests-panel">
        {(
          [
            ['erwachsene', 'Erwachsene', 'Ab 12 Jahren'],
            ['kinder', 'Kinder', '2–11 Jahre'],
            ['babys', 'Babys', 'Unter 2 Jahren · auf dem Schoss'],
          ] as const
        ).map(([key, title, description]) => (
          <div className="flug-counter" key={key}>
            <div>
              <b>{title}</b>
              <small>{description}</small>
            </div>
            <button
              type="button"
              aria-label={title + ' verringern'}
              disabled={
                key === 'erwachsene'
                  ? wert[key] <= Math.max(1, wert.babys)
                  : wert[key] === 0
              }
              onClick={() => setzen({ ...wert, [key]: wert[key] - 1 })}
            >
              <Minus size={16} />
            </button>
            <output aria-live="polite" aria-label={title}>
              {wert[key]}
            </output>
            <button
              type="button"
              aria-label={title + ' hinzufügen'}
              disabled={
                summe >= 9 || (key === 'babys' && wert.babys >= wert.erwachsene)
              }
              onClick={() => setzen({ ...wert, [key]: wert[key] + 1 })}
            >
              <Plus size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="flug-guests-done"
          onClick={() => {
            if (ref.current) {
              ref.current.open = false
              ref.current.querySelector('summary')?.focus()
            }
          }}
        >
          Übernehmen
        </button>
      </div>
    </details>
  )
}
