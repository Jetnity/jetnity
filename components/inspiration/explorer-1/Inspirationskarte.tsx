'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ArrowRight, MapPin } from 'lucide-react'
import { THEMEN, type EntdeckenZiel } from '@/lib/inspiration/explorer-1/katalog'

export default function Inspirationskarte({ ziel, zuerst }: { ziel: EntdeckenZiel; zuerst: boolean }) {
  const [bildFehlt, setBildFehlt] = useState(false)
  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-[28px] border border-line-200 bg-surface-0">
      <div className="relative aspect-[16/10] bg-surface-100">
        {bildFehlt ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-5 text-brand-800" role="img" aria-label={`Bild von ${ziel.name} nicht verfügbar`}>
            <MapPin className="h-8 w-8" aria-hidden="true" />
            <span className="text-sm">Bild nicht verfügbar</span>
          </div>
        ) : (
          <Image src={ziel.image} alt={`Reiseinspiration ${ziel.name}, ${ziel.country}`} fill
            loading={zuerst ? 'eager' : 'lazy'}
            sizes="(max-width: 767px) 100vw, (max-width: 1280px) 50vw, 600px"
            className="object-cover" onError={() => setBildFehlt(true)} />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-7">
        <p className="text-sm text-ink-900">{ziel.country}</p>
        <h3 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">{ziel.name}</h3>
        <ul aria-label="Redaktionelle Themen" className="mt-3 flex flex-wrap gap-2">
          {ziel.themen.map((id) => <li key={id} className="rounded-full bg-surface-50 px-3 py-1 text-xs font-medium text-brand-800">{THEMEN.find((thema) => thema.id === id)?.label}</li>)}
        </ul>
        <p className="mt-4 text-base leading-7 text-ink-950">{ziel.beschreibung}</p>
        <details className="mt-4 rounded-2xl border border-line-200 p-1">
          <summary className="min-h-11 cursor-pointer rounded-xl px-3 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
            Reiseidee für {ziel.name}
          </summary>
          <div className="px-3 pb-3 text-sm leading-6 text-ink-950">
            <p>{ziel.idea}</p>
            <p className="mt-2">Ein Vorschlag zum Anpassen. Dauer und Aktivitäten sind Ideen; deine Daten und Wünsche legst du in der Planung fest.</p>
          </div>
        </details>
        <div className="mt-auto pt-5">
          {ziel.href ? (
            <a href={ziel.href} className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-brand-800 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600">
              Reise mit diesem Ziel planen<span className="sr-only">: {ziel.name}</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </a>
          ) : <p role="status" className="text-sm text-ink-950">Dieses Ziel kann gerade nicht an die Planung übergeben werden.</p>}
        </div>
      </div>
    </article>
  )
}
