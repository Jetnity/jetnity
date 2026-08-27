'use client'

import * as React from 'react'

import type { SucheLage } from '@/lib/suche/lage'
import { cn } from '@/lib/utils'

export type SuchlistenEintrag = {
  id: string
  primaer: string
  sekundaer?: string
  extra?: string
}

export default function Suchliste({
  id,
  lage,
  eintraege,
  aktiv,
  onWaehlen,
  leerText,
  fehlerText,
  className,
}: {
  id: string
  lage: SucheLage
  eintraege: SuchlistenEintrag[]
  aktiv: number
  onWaehlen: (index: number) => void
  leerText: string
  fehlerText: string
  className?: string
}) {
  return (
    <ul
      id={id}
      role="listbox"
      className={cn(
        'absolute z-30 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-line-200 bg-white py-1 shadow-[0_18px_50px_rgba(15,46,42,0.12)]',
        className,
      )}
    >
      {lage === 'loading' && (
        <li className="px-4 py-3 text-sm text-ink-700">Suche …</li>
      )}
      {lage === 'unavailable' && (
        <li role="alert" className="px-4 py-3 text-sm text-red-700">
          {fehlerText}
        </li>
      )}
      {lage === 'error' && (
        <li role="alert" className="px-4 py-3 text-sm text-red-700">
          {fehlerText}
        </li>
      )}
      {lage === 'empty' && (
        <li className="px-4 py-3 text-sm text-ink-700">{leerText}</li>
      )}
      {lage === 'results' &&
        eintraege.map((eintrag, index) => (
          <li
            key={eintrag.id}
            id={`${id}-${index}`}
            role="option"
            aria-selected={aktiv === index}
            tabIndex={-1}
            onMouseDown={(ereignis) => ereignis.preventDefault()}
            onClick={() => onWaehlen(index)}
            className={cn(
              'flex min-h-11 w-full cursor-pointer items-start justify-between gap-3 px-4 py-2.5 text-left text-sm transition',
              aktiv === index ? 'bg-surface-50' : 'hover:bg-surface-25',
            )}
          >
            <span className="min-w-0">
              <span className="block font-medium text-brand-800">{eintrag.primaer}</span>
              {eintrag.sekundaer && (
                <span className="mt-0.5 block text-xs text-ink-700">{eintrag.sekundaer}</span>
              )}
            </span>
            {eintrag.extra && (
              <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-700">
                {eintrag.extra}
              </span>
            )}
          </li>
        ))}
    </ul>
  )
}
